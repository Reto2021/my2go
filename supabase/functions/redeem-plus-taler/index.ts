import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TALER_COST = 500;
const PLUS_DAYS = 30;

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REDEEM-PLUS-TALER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user's current balance
    const { data: balanceData, error: balanceError } = await supabaseClient
      .rpc('get_user_balance', { _user_id: user.id });
    
    if (balanceError) throw new Error(`Balance error: ${balanceError.message}`);
    const balance = balanceData?.[0]?.taler_balance || 0;
    logStep("Current balance", { balance });

    if (balance < TALER_COST) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Du brauchst mindestens ${TALER_COST} Taler. Aktuell: ${balance} Taler.`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get user's current subscription status
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_status, subscription_ends_at, free_trial_started_at')
      .eq('id', user.id)
      .single();
    
    if (profileError) throw new Error(`Profile error: ${profileError.message}`);
    logStep("Current subscription status", { 
      status: profile?.subscription_status,
      ends_at: profile?.subscription_ends_at 
    });

    // Calculate new subscription end date
    let newEndDate: Date;
    const now = new Date();
    
    if (profile?.subscription_ends_at) {
      const currentEnd = new Date(profile.subscription_ends_at);
      // If subscription is still active, extend from current end
      if (currentEnd > now) {
        newEndDate = new Date(currentEnd.getTime() + PLUS_DAYS * 24 * 60 * 60 * 1000);
      } else {
        // If expired, start from now
        newEndDate = new Date(now.getTime() + PLUS_DAYS * 24 * 60 * 60 * 1000);
      }
    } else {
      // No previous subscription, start from now
      newEndDate = new Date(now.getTime() + PLUS_DAYS * 24 * 60 * 60 * 1000);
    }
    
    logStep("New subscription end date", { newEndDate: newEndDate.toISOString() });

    // Deduct Taler
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: TALER_COST,
        type: 'spend',
        source: 'system',
        description: `2Go Plus für ${PLUS_DAYS} Tage mit Taler eingelöst`,
      });
    
    if (transactionError) throw new Error(`Transaction error: ${transactionError.message}`);
    logStep("Taler deducted", { amount: TALER_COST });

    // Update subscription in profile
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_tier: 'taler',
        subscription_ends_at: newEndDate.toISOString(),
      })
      .eq('id', user.id);
    
    if (updateError) throw new Error(`Update error: ${updateError.message}`);
    logStep("Subscription updated successfully");

    return new Response(JSON.stringify({ 
      success: true,
      message: `2Go Plus für ${PLUS_DAYS} Tage aktiviert!`,
      subscription_ends_at: newEndDate.toISOString(),
      taler_spent: TALER_COST,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
