import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransactionRequest {
  user_code: string; // The permanent code or qr_payload from user
  transaction_type: 'visit' | 'purchase';
  amount?: number; // For purchase: the amount in CHF
  partner_id: string;
}

interface TransactionResponse {
  success: boolean;
  error?: string;
  taler_awarded?: number;
  user_name?: string;
  new_balance?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get auth header to verify partner admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Nicht autorisiert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with service role for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create client with user token to verify partner admin
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Nicht autorisiert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: TransactionRequest = await req.json();
    const { user_code, transaction_type, amount, partner_id } = body;

    // Validate required fields
    if (!user_code || !transaction_type || !partner_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Fehlende Pflichtfelder" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the requesting user is a partner admin for this partner
    const { data: partnerAdmin, error: partnerError } = await supabaseAdmin
      .from('partner_admins')
      .select('id, role, can_confirm_redemptions')
      .eq('user_id', user.id)
      .eq('partner_id', partner_id)
      .single();

    if (partnerError || !partnerAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Keine Berechtigung für diesen Partner" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the user by their code (permanent_code or qr_payload)
    const { data: userCodeData, error: userCodeError } = await supabaseAdmin
      .from('user_codes')
      .select('user_id')
      .or(`permanent_code.eq.${user_code},qr_payload.eq.${user_code}`)
      .eq('is_active', true)
      .single();

    if (userCodeError || !userCodeData) {
      return new Response(
        JSON.stringify({ success: false, error: "Ungültiger User-Code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetUserId = userCodeData.user_id;

    // Get user profile for display name
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('display_name, first_name')
      .eq('id', targetUserId)
      .single();

    const userName = userProfile?.display_name || userProfile?.first_name || 'Kunde';

    // Get partner name
    const { data: partner } = await supabaseAdmin
      .from('partners')
      .select('name')
      .eq('id', partner_id)
      .single();

    const partnerName = partner?.name || 'Partner';

    // Get system settings for Taler calculation
    const { data: settings } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', ['visit_bonus_taler', 'purchase_taler_per_chf']);

    const settingsMap: Record<string, number> = {};
    settings?.forEach(s => {
      settingsMap[s.key] = typeof s.value === 'number' ? s.value : parseInt(String(s.value)) || 0;
    });

    // Default values if not configured
    const visitBonus = settingsMap['visit_bonus_taler'] || 5;
    const talerPerChf = settingsMap['purchase_taler_per_chf'] || 1;

    // Calculate Taler to award
    let talerAwarded = 0;
    let description = '';
    let source: 'partner_visit' | 'partner_purchase' = 'partner_visit';

    if (transaction_type === 'visit') {
      talerAwarded = visitBonus;
      description = `Besuch bei ${partnerName}`;
      source = 'partner_visit';
    } else if (transaction_type === 'purchase') {
      if (!amount || amount <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: "Betrag erforderlich für Einkauf" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      talerAwarded = Math.floor(amount * talerPerChf);
      description = `Einkauf bei ${partnerName} (CHF ${amount.toFixed(2)})`;
      source = 'partner_purchase';
    }

    if (talerAwarded <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Keine Taler zu vergeben" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the transaction
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: targetUserId,
        amount: talerAwarded,
        type: 'earn',
        source: source,
        description: description,
        partner_id: partner_id,
      });

    if (txError) {
      console.error('Transaction error:', txError);
      return new Response(
        JSON.stringify({ success: false, error: "Transaktion fehlgeschlagen" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get updated balance
    const { data: balanceData } = await supabaseAdmin.rpc('get_user_balance', { _user_id: targetUserId });
    const newBalance = balanceData?.[0]?.taler_balance || 0;

    const response: TransactionResponse = {
      success: true,
      taler_awarded: talerAwarded,
      user_name: userName,
      new_balance: newBalance,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Partner transaction error:', error);
    return new Response(
      JSON.stringify({ success: false, error: "Ein Fehler ist aufgetreten" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
