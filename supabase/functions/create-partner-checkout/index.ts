import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PARTNER-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { 
      planId, 
      interval, 
      activationPriceId, 
      subscriptionPriceId, 
      posKitPriceId,
      email 
    } = await req.json();

    logStep("Received request", { planId, interval, activationPriceId, subscriptionPriceId, posKitPriceId });

    if (!activationPriceId || !subscriptionPriceId) {
      throw new Error("Missing required price IDs");
    }

    // Build line items for one-time charges (activation fee + optional POS kit)
    const oneTimeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price: activationPriceId,
        quantity: 1,
      }
    ];

    if (posKitPriceId) {
      oneTimeLineItems.push({
        price: posKitPriceId,
        quantity: 1,
      });
    }

    // Create checkout session with subscription + one-time items
    const origin = req.headers.get("origin") || "https://my2go.win";
    
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: subscriptionPriceId,
          quantity: 1,
        },
        ...oneTimeLineItems.map(item => ({
          ...item,
          // Add one-time items as invoice items
        }))
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          plan_id: planId,
          billing_interval: interval,
        }
      },
      payment_method_collection: "always",
      success_url: `${origin}/go/partner/thank-you?session_id={CHECKOUT_SESSION_ID}&pos_kit=${posKitPriceId ? 'true' : 'false'}`,
      cancel_url: `${origin}/go/partner/checkout?plan=${planId}&interval=${interval}`,
      metadata: {
        plan_id: planId,
        billing_interval: interval,
        pos_kit_price_id: posKitPriceId || '',
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer_email: email || undefined,
    };

    // For one-time items with subscription, we need to use invoice items
    // Stripe doesn't allow mixing modes, so we add activation fee to first invoice
    if (oneTimeLineItems.length > 0) {
      sessionParams.subscription_data!.add_invoice_items = oneTimeLineItems.map(item => ({
        price: item.price as string,
        quantity: item.quantity,
      }));
      // Remove one-time items from line_items (only subscription item)
      sessionParams.line_items = [
        {
          price: subscriptionPriceId,
          quantity: 1,
        }
      ];
    }

    logStep("Creating checkout session", sessionParams);

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

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
