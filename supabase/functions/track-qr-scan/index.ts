import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get client IP from headers (set by CDN/proxy)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("x-real-ip") 
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    const { 
      partner_id, 
      utm_source, 
      utm_medium, 
      utm_campaign, 
      user_agent, 
      referrer 
    } = await req.json();

    if (!partner_id) {
      return new Response(
        JSON.stringify({ success: false, error: "partner_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user ID from auth header if present
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id || null;
    }

    // Call the rate-limited function with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.rpc("insert_qr_scan_rate_limited", {
      _partner_id: partner_id,
      _utm_source: utm_source || null,
      _utm_medium: utm_medium || null,
      _utm_campaign: utm_campaign || null,
      _user_agent: user_agent || null,
      _referrer: referrer || null,
      _user_id: userId,
      _ip_address: clientIP !== "unknown" ? clientIP : null,
    });

    if (error) {
      console.error("Error tracking QR scan:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in track-qr-scan:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
