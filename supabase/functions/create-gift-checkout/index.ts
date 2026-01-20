import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CREATE-GIFT-CHECKOUT] ${step}`, details ? JSON.stringify(details) : '');
};

// Gift price IDs
const GIFT_PRICES = {
  monthly: 'price_1So2FeDrdtIKNLRZ0Y8ZKjSA', // 2Go Plus Monthly price
  yearly: 'price_1So2FeDrdtIKNLRZvCBj8l3D',  // 2Go Plus Yearly price
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { giftType, recipientEmail, recipientName, personalMessage } = await req.json();
    logStep("Gift request received", { giftType, recipientEmail, recipientName });

    if (!giftType || !recipientEmail) {
      throw new Error("Missing required fields");
    }

    const priceId = GIFT_PRICES[giftType as keyof typeof GIFT_PRICES];
    if (!priceId) {
      throw new Error("Invalid gift type");
    }

    // Generate unique gift code
    const giftCode = `GIFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    logStep("Gift code generated", { giftCode });

    // Store gift in database
    const { error: insertError } = await supabaseClient
      .from('gift_codes')
      .insert({
        code: giftCode,
        gift_type: giftType,
        purchaser_id: user.id,
        purchaser_email: user.email,
        recipient_email: recipientEmail,
        recipient_name: recipientName || null,
        personal_message: personalMessage || null,
        status: 'pending',
      });

    if (insertError) {
      // Table might not exist, log but continue
      logStep("Warning: Could not store gift code", { error: insertError.message });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://my2go.lovable.app";

    // Create checkout session for gift
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment", // One-time payment for gift
      success_url: `${origin}/gift/success?code=${giftCode}&recipient=${encodeURIComponent(recipientName || recipientEmail)}`,
      cancel_url: `${origin}/?gift=cancelled`,
      metadata: {
        gift_code: giftCode,
        gift_type: giftType,
        recipient_email: recipientEmail,
        recipient_name: recipientName || '',
        personal_message: personalMessage || '',
        purchaser_id: user.id,
      },
      payment_intent_data: {
        metadata: {
          gift_code: giftCode,
          recipient_email: recipientEmail,
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url, giftCode }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
