import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logStep("No valid authorization header - returning free status");
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: "free",
        subscription_tier: null,
        subscription_end: null,
        is_trial: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData?.user) {
      logStep("Auth failed - returning free status", { error: userError?.message });
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: "free",
        subscription_tier: null,
        subscription_end: null,
        is_trial: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("User has no email - returning free status");
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: "free",
        subscription_tier: null,
        subscription_end: null,
        is_trial: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user has free trial (existing users get 30 days)
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("subscription_status, subscription_tier, subscription_ends_at, free_trial_started_at, created_at")
      .eq("id", user.id)
      .single();

    // Check for free trial eligibility (users created before feature launch)
    const featureLaunchDate = new Date("2026-01-18"); // Today
    const userCreatedAt = profile?.created_at ? new Date(profile.created_at) : new Date();
    const isExistingUser = userCreatedAt < featureLaunchDate;
    
    if (isExistingUser && !profile?.free_trial_started_at && !profile?.subscription_status?.includes("active")) {
      // Start 30-day free trial for existing users
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);
      
      await supabaseClient
        .from("profiles")
        .update({
          subscription_status: "trial",
          subscription_ends_at: trialEndDate.toISOString(),
          free_trial_started_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      logStep("Started free trial for existing user", { userId: user.id, trialEnds: trialEndDate });
      
      return new Response(JSON.stringify({
        subscribed: true,
        status: "trial",
        subscription_tier: null,
        subscription_end: trialEndDate.toISOString(),
        is_trial: true,
        trial_days_remaining: 30,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if still in trial period
    if (profile?.subscription_status === "trial" && profile?.subscription_ends_at) {
      const trialEndDate = new Date(profile.subscription_ends_at);
      const now = new Date();
      if (trialEndDate > now) {
        const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        logStep("User still in trial", { daysRemaining });
        
        return new Response(JSON.stringify({
          subscribed: true,
          status: "trial",
          subscription_tier: null,
          subscription_end: trialEndDate.toISOString(),
          is_trial: true,
          trial_days_remaining: daysRemaining,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Check Stripe subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      
      // Update profile to free if trial expired
      if (profile?.subscription_status === "trial") {
        await supabaseClient
          .from("profiles")
          .update({ subscription_status: "free" })
          .eq("id", user.id);
      }
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: "free",
        subscription_tier: null,
        subscription_end: null,
        is_trial: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Update stripe_customer_id in profile
    await supabaseClient
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;
    let productId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product;
      
      // Determine tier based on product
      if (productId === "prod_TogLk3NY8R9yCe") {
        subscriptionTier = "monthly";
      } else if (productId === "prod_TogLaHeXoppg5S") {
        subscriptionTier = "yearly";
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, tier: subscriptionTier });

      // Update profile
      await supabaseClient
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_tier: subscriptionTier,
          subscription_ends_at: subscriptionEnd,
        })
        .eq("id", user.id);
    } else {
      logStep("No active subscription found");
      
      await supabaseClient
        .from("profiles")
        .update({
          subscription_status: "free",
          subscription_tier: null,
          subscription_ends_at: null,
        })
        .eq("id", user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      status: hasActiveSub ? "active" : "free",
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      is_trial: false,
      product_id: productId,
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
