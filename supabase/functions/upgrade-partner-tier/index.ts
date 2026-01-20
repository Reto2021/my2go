import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPGRADE-PARTNER-TIER] ${step}${detailsStr}`);
};

// Price IDs for Partner tier upgrade (Starter -> Partner)
const PRICE_IDS = {
  monthly: 'price_1So2G5DrdtIKNLRZk2i7nmrU', // My 2Go Starter Monthly
  yearly: 'price_1So2GuDrdtIKNLRZFTgJhKvS', // My 2Go Starter Yearly
  activation: 'price_1So2EzDrdtIKNLRZGzPVgX5e', // Activation Fee
};

const MWST_RATE = 8.1;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { partner_id, billing_period = 'monthly' } = await req.json();

    if (!partner_id) {
      throw new Error("Missing partner_id");
    }

    logStep("Request received", { partner_id, billing_period });

    // Get partner details
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, name, tier, contact_email')
      .eq('id', partner_id)
      .single();

    if (partnerError || !partner) {
      throw new Error(`Partner not found: ${partnerError?.message}`);
    }

    logStep("Partner found", { name: partner.name, tier: partner.tier });

    // Check if already partner tier
    if (partner.tier === 'partner') {
      throw new Error("Partner is already on the Partner tier");
    }

    // Get or create tax rate
    const existingTaxRates = await stripe.taxRates.list({ active: true, limit: 100 });
    let taxRateId = existingTaxRates.data.find(
      (tr: Stripe.TaxRate) => tr.percentage === MWST_RATE && tr.country === 'CH' && tr.active
    )?.id;

    if (!taxRateId) {
      const newTaxRate = await stripe.taxRates.create({
        display_name: 'MwSt',
        description: 'Schweizer Mehrwertsteuer',
        percentage: MWST_RATE,
        country: 'CH',
        inclusive: false,
      });
      taxRateId = newTaxRate.id;
    }

    logStep("Tax rate ready", { taxRateId });

    // Determine price IDs
    const subscriptionPriceId = billing_period === 'yearly' ? PRICE_IDS.yearly : PRICE_IDS.monthly;

    const origin = req.headers.get("origin") || "https://my2go.app";

    const session = await stripe.checkout.sessions.create({
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
          partner_id: partner_id,
          upgrade_from: 'starter',
        },
        add_invoice_items: [
          {
            price: PRICE_IDS.activation,
            quantity: 1,
            tax_rates: [taxRateId],
          }
        ],
      },
      payment_method_collection: "always",
      success_url: `${origin}/partner-portal?upgraded=true`,
      cancel_url: `${origin}/partner-portal`,
      metadata: {
        partner_id: partner_id,
        upgrade_type: 'starter_to_partner',
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer_email: partner.contact_email || undefined,
      tax_id_collection: {
        enabled: true,
      },
    });

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
