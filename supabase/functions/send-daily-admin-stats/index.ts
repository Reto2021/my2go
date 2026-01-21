import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "contact@2gomedia.ch";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DAILY-ADMIN-STATS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting daily stats email generation");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterdayISO = yesterday.toISOString();
    const todayISO = today.toISOString();

    // Neue User (gestern)
    const { count: newUsersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayISO)
      .lt('created_at', todayISO);

    // Neue User Details
    const { data: newUsers } = await supabase
      .from('profiles')
      .select('id, first_name, email, created_at')
      .gte('created_at', yesterdayISO)
      .lt('created_at', todayISO)
      .order('created_at', { ascending: false })
      .limit(20);

    // Gesamt User
    const { count: totalUsersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Aktive Sessions (gestern)
    const { count: sessionsCount } = await supabase
      .from('radio_listening_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayISO)
      .lt('created_at', todayISO);

    // Transaktionen (gestern)
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('amount, type')
      .gte('created_at', yesterdayISO)
      .lt('created_at', todayISO);

    const talerEarned = transactionsData
      ?.filter(t => t.type === 'earn')
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const talerSpent = transactionsData
      ?.filter(t => t.type === 'spend')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    // Einlösungen (gestern)
    const { count: redemptionsCount } = await supabase
      .from('redemptions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayISO)
      .lt('created_at', todayISO);

    // Aktive Partner
    const { count: activePartnersCount } = await supabase
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Plus Abonnenten
    const { count: plusSubscribersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active');

    const dateFormatted = yesterday.toLocaleDateString('de-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    logStep("Stats collected", {
      newUsers: newUsersCount,
      sessions: sessionsCount,
      talerEarned,
      redemptions: redemptionsCount
    });

    // Generate new users table rows
    const newUsersRows = newUsers && newUsers.length > 0
      ? newUsers.map(u => `
          <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb; color: #374151;">${u.first_name || '-'}</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${u.email || '-'}</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
              ${new Date(u.created_at).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="3" style="padding: 20px; text-align: center; color: #9ca3af;">Keine neuen Registrierungen</td></tr>`;

    const emailResponse = await resend.emails.send({
      from: "2Go Admin <noreply@2gomedia.ch>",
      to: [ADMIN_EMAIL],
      subject: `📊 2Go Tagesreport – ${dateFormatted}`,
      html: `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 650px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 35px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">📊 2Go Tagesreport</h1>
                      <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0 0; font-size: 14px;">${dateFormatted}</p>
                    </td>
                  </tr>
                  
                  <!-- Stats Grid -->
                  <tr>
                    <td style="padding: 30px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <!-- Neue User -->
                          <td width="33%" style="padding: 10px;">
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 20px; text-align: center;">
                              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase;">Neue User</p>
                              <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 32px; font-weight: 700;">${newUsersCount || 0}</p>
                            </div>
                          </td>
                          <!-- Sessions -->
                          <td width="33%" style="padding: 10px;">
                            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 12px; padding: 20px; text-align: center;">
                              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase;">Sessions</p>
                              <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 32px; font-weight: 700;">${sessionsCount || 0}</p>
                            </div>
                          </td>
                          <!-- Einlösungen -->
                          <td width="33%" style="padding: 10px;">
                            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 20px; text-align: center;">
                              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase;">Einlösungen</p>
                              <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 32px; font-weight: 700;">${redemptionsCount || 0}</p>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Taler Stats -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
                        <tr>
                          <td width="50%" style="padding: 10px;">
                            <div style="background-color: #ecfdf5; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #a7f3d0;">
                              <p style="margin: 0; color: #065f46; font-size: 12px; text-transform: uppercase;">Taler verdient</p>
                              <p style="margin: 8px 0 0 0; color: #059669; font-size: 28px; font-weight: 700;">+${talerEarned.toLocaleString('de-CH')}</p>
                            </div>
                          </td>
                          <td width="50%" style="padding: 10px;">
                            <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #fcd34d;">
                              <p style="margin: 0; color: #92400e; font-size: 12px; text-transform: uppercase;">Taler eingelöst</p>
                              <p style="margin: 8px 0 0 0; color: #d97706; font-size: 28px; font-weight: 700;">-${talerSpent.toLocaleString('de-CH')}</p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Gesamtstatistiken -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px;">
                        <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px; font-weight: 600;">📈 Gesamtstatistiken</h3>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280;">Registrierte Nutzer</td>
                            <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${(totalUsersCount || 0).toLocaleString('de-CH')}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280;">Aktive Partner</td>
                            <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${activePartnersCount || 0}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280;">Plus Abonnenten</td>
                            <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">${plusSubscribersCount || 0}</td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Neue Registrierungen Liste -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px; font-weight: 600;">👥 Neue Registrierungen</h3>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <tr style="background-color: #f9fafb;">
                          <th style="padding: 12px 15px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Name</th>
                          <th style="padding: 12px 15px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Email</th>
                          <th style="padding: 12px 15px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Zeit</th>
                        </tr>
                        ${newUsersRows}
                      </table>
                    </td>
                  </tr>
                  
                  <!-- CTA -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px; text-align: center;">
                      <a href="https://my2go.lovable.app/admin" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                        Zum Admin Dashboard →
                      </a>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        Automatischer Tagesreport von 2Go · ${new Date().toLocaleDateString('de-CH')}
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

    logStep("Daily stats email sent successfully", { response: emailResponse });

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    logStep("Error sending daily stats email", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
