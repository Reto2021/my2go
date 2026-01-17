import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ACTIVATE-PARTNER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase config missing");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendKey ? new Resend(resendKey) : null;

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID required");
    }

    logStep("Verifying Stripe session", { sessionId });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    if (session.payment_status !== 'paid' && !session.subscription) {
      // For trial subscriptions, payment_status might be 'no_payment_required'
      if (session.payment_status !== 'no_payment_required') {
        throw new Error("Payment not completed");
      }
    }

    logStep("Session verified", { 
      customerId: session.customer,
      email: session.customer_email || (session.customer as Stripe.Customer)?.email,
      planId: session.metadata?.plan_id
    });

    const customerEmail = session.customer_email || 
      (typeof session.customer === 'object' ? (session.customer as Stripe.Customer).email : null);
    
    const planId = session.metadata?.plan_id || 'starter';
    const billingInterval = session.metadata?.billing_interval || 'monthly';
    const hasPosKit = !!session.metadata?.pos_kit_price_id;

    // Check if we already processed this session
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('id, is_active')
      .eq('contact_email', customerEmail)
      .maybeSingle();

    if (existingPartner?.is_active) {
      logStep("Partner already activated", { partnerId: existingPartner.id });
      return new Response(JSON.stringify({ 
        success: true, 
        partnerId: existingPartner.id,
        alreadyActivated: true,
        message: "Partner bereits aktiviert"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Generate a unique partner code
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '2GO-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const partnerCode = generateCode();

    // If partner exists but not active, activate them
    if (existingPartner) {
      const { error: updateError } = await supabase
        .from('partners')
        .update({ 
          is_active: true,
          verified_at: new Date().toISOString(),
          contract_start: new Date().toISOString(),
        })
        .eq('id', existingPartner.id);

      if (updateError) {
        logStep("Error activating existing partner", { error: updateError });
        throw updateError;
      }

      logStep("Activated existing partner", { partnerId: existingPartner.id });

      return new Response(JSON.stringify({ 
        success: true, 
        partnerId: existingPartner.id,
        partnerCode,
        planId,
        needsOnboarding: true,
        message: "Partner aktiviert - Onboarding erforderlich"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create new placeholder partner (will be completed in onboarding)
    const slug = `partner-${Date.now()}`;
    
    const { data: newPartner, error: insertError } = await supabase
      .from('partners')
      .insert({
        name: customerEmail?.split('@')[0] || 'Neuer Partner',
        slug,
        contact_email: customerEmail,
        is_active: false, // Will be activated after onboarding
        is_featured: false,
        contract_start: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      logStep("Error creating partner placeholder", { error: insertError });
      throw insertError;
    }

    logStep("Created partner placeholder", { partnerId: newPartner.id });

    // Send welcome email
    if (resend && customerEmail) {
      try {
        const welcomeEmail = await resend.emails.send({
          from: "My 2Go <partner@my2go.app>",
          to: [customerEmail],
          subject: "🎉 Willkommen bei My 2Go - Dein Partner-Account ist bereit!",
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 20px;">
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #023F5A 0%, #7AB8D6 100%); border-radius: 16px 16px 0 0;">
          <tr>
            <td style="padding: 30px; text-align: center;">
              <div style="background: white; display: inline-block; padding: 12px 24px; border-radius: 12px; font-size: 24px; font-weight: bold; color: #023F5A;">2Go</div>
              <h1 style="color: white; margin: 16px 0 0 0; font-size: 24px;">Willkommen bei My 2Go! 🎉</h1>
            </td>
          </tr>
        </table>
        
        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                Herzlichen Glückwunsch! Dein My 2Go Partner-Account wurde erfolgreich erstellt.
              </p>
              
              <div style="background: #f0f9ff; border-left: 4px solid #7AB8D6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #023F5A;">
                  <strong>Dein Plan:</strong> ${planId.charAt(0).toUpperCase() + planId.slice(1)} (${billingInterval === 'yearly' ? 'Jährlich' : 'Monatlich'})<br>
                  <strong>30-Tage Trial:</strong> Startet heute
                  ${hasPosKit ? '<br><strong>POS Kit:</strong> Wird nach Onboarding versendet' : ''}
                </p>
              </div>
              
              <h2 style="font-size: 18px; color: #023F5A; margin: 24px 0 16px 0;">Nächste Schritte</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <div style="width: 28px; height: 28px; background: #7AB8D6; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold;">1</div>
                        </td>
                        <td>
                          <strong style="color: #023F5A;">Onboarding abschliessen</strong>
                          <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">Firmeninfos eingeben, Logo hochladen, Öffnungszeiten festlegen</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <div style="width: 28px; height: 28px; background: #7AB8D6; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold;">2</div>
                        </td>
                        <td>
                          <strong style="color: #023F5A;">Erstes Reward erstellen</strong>
                          <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">Lege dein erstes Angebot an (z.B. 10% Rabatt, Gratis Kaffee)</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <div style="width: 28px; height: 28px; background: #FCB900; color: #023F5A; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold;">3</div>
                        </td>
                        <td>
                          <strong style="color: #023F5A;">Startklar!</strong>
                          <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">QR-Code ausdrucken, POS-Material platzieren - fertig!</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://my2go.app/go/partner/onboarding" style="display: inline-block; background: #023F5A; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Jetzt Onboarding starten →
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin: 24px 0 0 0; text-align: center;">
                Fragen? Antworte einfach auf diese E-Mail oder schreib uns auf WhatsApp.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #888;">
                2Go Media AG • Industriestrasse 19 • 5200 Brugg<br>
                <a href="https://www.2gomedia.ch" style="color: #7AB8D6;">www.2gomedia.ch</a> • partner@my2go.app
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        });
        
        logStep("Welcome email sent", { emailId: welcomeEmail.data?.id });
      } catch (emailError) {
        logStep("Failed to send welcome email", { error: emailError });
        // Don't fail the whole process if email fails
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      partnerId: newPartner.id,
      partnerCode,
      planId,
      needsOnboarding: true,
      message: "Partner-Account erstellt - Onboarding erforderlich"
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
