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

// Swiss MwSt rate
const MWST_RATE = 8.1;

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

    // First, create or get tax rate for Swiss MwSt
    let taxRateId: string;
    
    // Try to find existing tax rate
    const existingTaxRates = await stripe.taxRates.list({ 
      active: true, 
      limit: 100 
    });
    
    const swissMwSt = existingTaxRates.data.find(
      (tr: Stripe.TaxRate) => tr.percentage === MWST_RATE && tr.country === 'CH' && tr.active
    );
    
    if (swissMwSt) {
      taxRateId = swissMwSt.id;
      logStep("Found existing tax rate", { taxRateId });
    } else {
      // Create new tax rate
      const newTaxRate = await stripe.taxRates.create({
        display_name: 'MwSt',
        description: 'Schweizer Mehrwertsteuer',
        percentage: MWST_RATE,
        country: 'CH',
        inclusive: false,
      });
      taxRateId = newTaxRate.id;
      logStep("Created new tax rate", { taxRateId });
    }

    // Build one-time items for invoice (activation fee + optional POS kit)
    const invoiceItems: Stripe.Checkout.SessionCreateParams.SubscriptionData.AddInvoiceItem[] = [
      {
        price: activationPriceId,
        quantity: 1,
        tax_rates: [taxRateId],
      }
    ];

    if (posKitPriceId) {
      invoiceItems.push({
        price: posKitPriceId,
        quantity: 1,
        tax_rates: [taxRateId],
      });
    }

    const origin = req.headers.get("origin") || "https://my2go.win";
    
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: subscriptionPriceId,
          quantity: 1,
          tax_rates: [taxRateId],
        }
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          plan_id: planId,
          billing_interval: interval,
        },
        add_invoice_items: invoiceItems,
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
      tax_id_collection: {
        enabled: true,
      },
    };

    logStep("Creating checkout session", { 
      subscriptionPriceId, 
      invoiceItemsCount: invoiceItems.length,
      taxRateId 
    });

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
