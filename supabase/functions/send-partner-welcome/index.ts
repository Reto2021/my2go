import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PartnerWelcomeRequest {
  partnerId: string;
  partnerName: string;
  contactName: string;
  contactEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partnerId, partnerName, contactName, contactEmail }: PartnerWelcomeRequest = await req.json();

    if (!contactEmail || !partnerName || !contactName) {
      throw new Error("Missing required fields: contactEmail, partnerName, contactName");
    }

    // Get the app URL from environment or use default
    const appUrl = Deno.env.get("VITE_APP_URL") || "https://my2go.lovable.app";
    const loginUrl = `${appUrl}/auth?partner=true`;
    const onboardingUrl = `${appUrl}/go/partner/onboarding`;

    const emailResponse = await resend.emails.send({
      from: "2Go Taler <noreply@2go-taler.ch>",
      to: [contactEmail],
      subject: `Willkommen bei 2Go Taler, ${partnerName}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                        🎉 Willkommen bei 2Go Taler!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Hallo ${contactName},
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Herzlichen Glückwunsch! <strong>${partnerName}</strong> ist jetzt offiziell Teil des 2Go Taler Netzwerks. 
                        Du kannst dich ab sofort in dein Partner-Portal einloggen.
                      </p>
                      
                      <!-- CTA Button -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                              Zum Partner-Login →
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Info Box -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0f9ff; border-radius: 12px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 24px;">
                            <h3 style="margin: 0 0 16px; color: #1e40af; font-size: 16px; font-weight: 600;">
                              📋 Deine nächsten Schritte:
                            </h3>
                            <ol style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                              <li>Logge dich mit deiner E-Mail-Adresse ein</li>
                              <li>Richte dein Geschäftsprofil ein</li>
                              <li>Erstelle deine ersten Gutscheine</li>
                              <li>Teile deinen Partner-QR-Code mit Kunden</li>
                            </ol>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Bei Fragen erreichst du uns jederzeit per WhatsApp oder E-Mail.
                      </p>
                      
                      <p style="margin: 30px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        Beste Grüsse,<br>
                        <strong>Dein 2Go Taler Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                        © 2024 2Go Taler · Alle Rechte vorbehalten
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                        Diese E-Mail wurde an ${contactEmail} gesendet.
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

    console.log("Partner welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-partner-welcome function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
