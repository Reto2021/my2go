import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PLUS-CHECKOUT] ${step}${detailsStr}`);
};

// Price IDs for 2Go Plus
const PRICE_IDS = {
  monthly: "price_1Sr2yuDrdtIKNLRZj7OEIbG4",
  yearly: "price_1Sr2ywDrdtIKNLRZ43RadmZj",
};

// Stripe coupon ID for 10% renewal discount
const RENEWAL_COUPON_ID = "R5RGpBBl";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { tier, applyDiscount } = await req.json();
    if (!tier || !["monthly", "yearly"].includes(tier)) {
      throw new Error("Invalid tier specified");
    }
    logStep("Tier selected", { tier, applyDiscount });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user has a valid discount code
    let shouldApplyDiscount = false;
    if (applyDiscount) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      const { data: discountData } = await supabaseAdmin
        .from('system_settings')
        .select('value')
        .eq('key', `plus_renewal_discount_${user.id}`)
        .single();
      
      if (discountData?.value) {
        const discount = discountData.value as { used: boolean; expires_at: string };
        if (discount.used && new Date(discount.expires_at) > new Date()) {
          shouldApplyDiscount = true;
          logStep("Discount code verified", { userId: user.id });
        }
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const priceId = PRICE_IDS[tier as keyof typeof PRICE_IDS];
    logStep("Using price", { priceId });

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/rewards?subscription=success`,
      cancel_url: `${req.headers.get("origin")}/rewards?subscription=cancelled`,
      metadata: {
        user_id: user.id,
        tier: tier,
      },
      locale: "de",
    };

    // Apply discount coupon if user has a valid discount code
    if (shouldApplyDiscount) {
      sessionParams.discounts = [{ coupon: RENEWAL_COUPON_ID }];
      logStep("Applying 10% renewal discount coupon");
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
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
