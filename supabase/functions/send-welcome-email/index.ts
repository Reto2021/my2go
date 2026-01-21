import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WELCOME-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName } = await req.json();
    
    logStep("Processing welcome email request", { email, firstName });

    if (!email) {
      throw new Error("Email is required");
    }

    const displayName = firstName || "Neues Mitglied";

    const emailResponse = await resend.emails.send({
      from: "2Go <onboarding@resend.dev>",
      to: [email],
      subject: "Willkommen bei 2Go! 🎉",
      html: `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Willkommen bei 2Go! 🎉</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #333333; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hallo ${displayName}!
                      </p>
                      
                      <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                        Herzlich willkommen in der 2Go Community! Wir freuen uns sehr, dass du dabei bist.
                      </p>
                      
                      <div style="background-color: #f0f9ff; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                        <h2 style="color: #2563eb; margin: 0 0 15px 0; font-size: 18px;">Was dich erwartet:</h2>
                        <ul style="color: #555555; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                          <li>📻 Radio hören und Taler sammeln</li>
                          <li>🎁 Exklusive Rewards bei Partnern einlösen</li>
                          <li>🏆 Badges und Erfolge freischalten</li>
                          <li>👥 Teil einer wachsenden Community werden</li>
                        </ul>
                      </div>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="https://my2go.lovable.app" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600;">
                          Jetzt loslegen →
                        </a>
                      </div>
                      
                      <p style="color: #888888; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0; text-align: center;">
                        Bei Fragen sind wir jederzeit für dich da!
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 13px; margin: 0;">
                        © ${new Date().getFullYear()} 2Go · Dein lokales Bonusprogramm
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

    logStep("Email sent successfully", { response: emailResponse });

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    logStep("Error sending welcome email", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
