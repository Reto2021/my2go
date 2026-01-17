import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MehrbesucheData {
  totalVisitsPerMonth: { conservative: number; realistic: number; ambitious: number };
  totalVisitsPerYear: { conservative: number; realistic: number; ambitious: number };
  upliftCHFPerMonth: { conservative: number; realistic: number; ambitious: number };
  assumptions: {
    transactionsPerMonth: number;
    avgBasket: number;
    repeatShare: number;
    enrollmentRate: string;
    activeRate: string;
    hasReviewGap: boolean;
  };
}

interface ReportEmailRequest {
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  fitScore: 'A' | 'B' | 'C';
  fitLabel: string;
  planName: string;
  planPrice: number;
  totalSavings: number;
  coveragePercent: number;
  isCovered: boolean;
  gap?: number;
  savingsBreakdown: Array<{ label: string; amount: number }>;
  timeSavings: number;
  timeHours: number;
  sponsoringSavings: number;
  modules: Array<{ title: string; desc: string }>;
  // NEW: Mehrbesuche data (primary)
  mehrbesuche?: MehrbesucheData;
  // LEGACY: CHF-based uplift (kept for backward compat)
  uplift?: {
    conservative: number;
    realistic: number;
    ambitious: number;
  };
  miniPriceLever?: {
    requiredExtraRevenue: number;
    priceIncreasePerSale: number;
  };
  recommendReviewBooster?: boolean;
}

function formatCHF(value: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatVisits(value: number): string {
  return value.toFixed(1).replace('.0', '');
}

function generateEmailHTML(data: ReportEmailRequest): string {
  const fitColors = {
    A: { bg: '#dcfce7', color: '#166534' },
    B: { bg: '#fef3c7', color: '#92400e' },
    C: { bg: '#fee2e2', color: '#991b1b' }
  };
  
  const fitColor = fitColors[data.fitScore];
  const mehrbesuche = data.mehrbesuche;
  
  // Generate 12-month chart bars
  const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const monthlyIncrement = mehrbesuche?.totalVisitsPerMonth.realistic || 0;
  const maxVisits = monthlyIncrement * 12;
  
  const chartBarsHtml = monthLabels.map((label, idx) => {
    const cumulativeVisits = monthlyIncrement * (idx + 1);
    const barHeight = maxVisits > 0 ? Math.round((cumulativeVisits / maxVisits) * 50) : 0;
    const isLast = idx === 11;
    return `
      <td style="text-align: center; vertical-align: bottom; padding: 0 2px;">
        <div style="background: ${isLast ? '#3b82f6' : '#93c5fd'}; height: ${Math.max(4, barHeight)}px; width: 100%; border-radius: 2px 2px 0 0;"></div>
        <div style="font-size: 9px; color: #888; margin-top: 4px;">${label}</div>
      </td>
    `;
  }).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ihr 2Go Partner Fit-Check Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%); padding: 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background: white; border-radius: 10px; padding: 8px 16px; font-size: 24px; font-weight: bold; color: #FF6B00;">2Go</div>
                    <div style="color: white; font-size: 14px; margin-top: 8px;">Das Loyalitäts-Netzwerk</div>
                  </td>
                  <td style="text-align: right; color: white; font-size: 12px;">
                    <strong>2Go Media AG</strong><br>
                    Industriestrasse 19<br>
                    5200 Brugg<br>
                    partner@my2go.app
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Greeting -->
              <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
                Hallo ${data.recipientName},
              </p>
              <p style="color: #666; margin-bottom: 30px;">
                hier ist Ihr persönlicher Partner Fit-Check Report für <strong>${data.companyName}</strong>.
              </p>
              
              <!-- Plan Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%); border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 30px; text-align: center; color: white;">
                    <div style="display: inline-block; background: ${fitColor.bg}; color: ${fitColor.color}; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 15px;">
                      ${data.fitLabel}
                    </div>
                    <div style="font-size: 28px; font-weight: bold; margin-bottom: 5px;">${data.planName}</div>
                    <div style="font-size: 36px; font-weight: bold;">${formatCHF(data.planPrice)}</div>
                    <div style="font-size: 14px; opacity: 0.8;">pro Monat</div>
                  </td>
                </tr>
              </table>
              
              ${mehrbesuche ? `
              <!-- Mehrbesuche Section (Primary) -->
              <div style="margin-bottom: 30px;">
                <h3 style="font-size: 18px; color: #333; margin-bottom: 15px;">👥 Mehrbesuche nach 12 Monaten</h3>
                <p style="font-size: 14px; color: #666; margin-bottom: 15px;">So sieht My2Go bei Ihnen nach 12 Monaten aus</p>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px;">
                  <tr>
                    <td style="padding: 25px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center; padding: 10px; width: 33%;">
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">Konservativ</div>
                            <div style="font-size: 16px; font-weight: bold; color: #64748b;">+${formatVisits(mehrbesuche.totalVisitsPerMonth.conservative)}</div>
                            <div style="font-size: 11px; color: #888;">Besuche/Mt.</div>
                            <div style="font-size: 14px; font-weight: bold; color: #64748b; margin-top: 5px;">+${formatVisits(mehrbesuche.totalVisitsPerYear.conservative)}/Jahr</div>
                          </td>
                          <td style="text-align: center; padding: 15px; background: #3b82f6; border-radius: 8px; width: 34%;">
                            <div style="font-size: 13px; color: white; margin-bottom: 5px;">Realistisch</div>
                            <div style="font-size: 22px; font-weight: bold; color: white;">+${formatVisits(mehrbesuche.totalVisitsPerMonth.realistic)}</div>
                            <div style="font-size: 11px; color: rgba(255,255,255,0.8);">Besuche/Mt.</div>
                            <div style="font-size: 18px; font-weight: bold; color: white; margin-top: 5px;">+${formatVisits(mehrbesuche.totalVisitsPerYear.realistic)}/Jahr</div>
                          </td>
                          <td style="text-align: center; padding: 10px; width: 33%;">
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">Ambitioniert</div>
                            <div style="font-size: 16px; font-weight: bold; color: #22c55e;">+${formatVisits(mehrbesuche.totalVisitsPerMonth.ambitious)}</div>
                            <div style="font-size: 11px; color: #888;">Besuche/Mt.</div>
                            <div style="font-size: 14px; font-weight: bold; color: #22c55e; margin-top: 5px;">+${formatVisits(mehrbesuche.totalVisitsPerYear.ambitious)}/Jahr</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- 12-Month Growth Chart -->
              <div style="margin-bottom: 30px;">
                <h4 style="font-size: 14px; color: #333; margin-bottom: 10px;">📈 12-Monats-Wachstumsprognose</h4>
                <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9f9f9; border-radius: 8px; padding: 15px;">
                  <tr>
                    <td style="padding: 15px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="height: 70px;">
                        <tr style="height: 50px;">
                          ${chartBarsHtml}
                        </tr>
                      </table>
                      <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #3b82f6; font-weight: bold;">
                        Kumuliert: +${formatVisits(mehrbesuche.totalVisitsPerYear.realistic)} Besuche nach 12 Monaten
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Assumptions -->
              <div style="margin-bottom: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px; font-size: 12px; color: #666;">
                <strong>Annahmen:</strong> ${mehrbesuche.assumptions.transactionsPerMonth} Transaktionen/Mt. • Ø Bon ${formatCHF(mehrbesuche.assumptions.avgBasket)} • Stammkundenanteil ${formatPercent(mehrbesuche.assumptions.repeatShare)}
                ${mehrbesuche.assumptions.hasReviewGap ? ' • inkl. Review-Turbo' : ''}
              </div>
              
              <!-- CHF Estimate (optional) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #eff6ff; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #3b82f6;">
                <tr>
                  <td style="padding: 15px;">
                    <div style="font-size: 13px; color: #1e40af;">
                      💡 <strong>CHF-Schätzung (optional):</strong> ~${formatCHF(mehrbesuche.upliftCHFPerMonth.realistic)}/Monat (realistisch)
                    </div>
                    <div style="font-size: 11px; color: #888; margin-top: 5px;">Schätzung basiert auf Ø Bon. Keine Garantie.</div>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Absicherung Section -->
              <div style="margin-bottom: 30px;">
                <h3 style="font-size: 18px; color: #333; margin-bottom: 15px;">🛡️ Absicherung (ohne Wachstum)</h3>
                
                <table width="100%" cellpadding="0" cellspacing="0" style="background: ${data.isCovered ? '#dcfce7' : '#fef3c7'}; border-radius: 12px; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 25px; text-align: center;">
                      <div style="font-size: 20px; font-weight: bold; color: ${data.isCovered ? '#166534' : '#92400e'}; margin-bottom: 8px;">
                        ${data.isCovered ? '✅ Vollständig refinanziert!' : `⚡ ${formatPercent(data.coveragePercent / 100)} bereits gedeckt`}
                      </div>
                      <div style="color: ${data.isCovered ? '#166534' : '#92400e'};">
                        Total Einsparungen: <strong>${formatCHF(data.totalSavings)}</strong> /Monat
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Savings Breakdown -->
              <div style="margin-bottom: 30px;">
                <h4 style="font-size: 14px; color: #333; margin-bottom: 10px;">💰 Ihre Einsparungen im Detail</h4>
                <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9f9f9; border-radius: 12px;">
                  <tr>
                    <td style="padding: 20px;">
                      ${data.savingsBreakdown.map(item => `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
                          <span style="color: #666;">${item.label}</span>
                          <span style="font-weight: bold; color: #22c55e;">+${formatCHF(item.amount)}</span>
                        </div>
                      `).join('')}
                      ${data.timeSavings > 0 ? `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
                          <span style="color: #666;">Zeit-Einsparungen (${data.timeHours}h × CHF 90)</span>
                          <span style="font-weight: bold; color: #22c55e;">+${formatCHF(data.timeSavings)}</span>
                        </div>
                      ` : ''}
                      ${data.sponsoringSavings > 0 ? `
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e5e5;">
                          <span style="color: #666;">Sponsoring-Potenzial</span>
                          <span style="font-weight: bold; color: #22c55e;">+${formatCHF(data.sponsoringSavings)}</span>
                        </div>
                      ` : ''}
                      <div style="display: flex; justify-content: space-between; padding: 15px 0 5px; margin-top: 10px; border-top: 2px solid #22c55e; background: #dcfce7; margin: 10px -20px -20px; padding: 15px 20px; border-radius: 0 0 12px 12px;">
                        <span style="font-weight: bold; color: #166534;">🎉 Total</span>
                        <span style="font-weight: bold; font-size: 18px; color: #166534;">${formatCHF(data.totalSavings)}</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              
              ${data.recommendReviewBooster ? `
              <!-- Review Booster Recommendation -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef3c7; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-weight: bold; color: #92400e; margin-bottom: 8px;">⭐ Review-Booster empfohlen</div>
                    <div style="color: #92400e; font-size: 14px;">
                      Wir haben eine Review-Lücke erkannt. Mit dem Review-Booster Modul können Sie systematisch Bewertungen sammeln.
                    </div>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Recommended Modules -->
              <div style="margin-bottom: 30px;">
                <h3 style="font-size: 18px; color: #333; margin-bottom: 15px;">✨ Empfohlene Module</h3>
                ${data.modules.map(module => `
                  <div style="background: #f9f9f9; border-left: 4px solid #FF6B00; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                    <div style="font-weight: bold; color: #333;">${module.title}</div>
                    <div style="font-size: 14px; color: #666;">${module.desc}</div>
                  </div>
                `).join('')}
              </div>
              
              <!-- Key Message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #eff6ff; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-weight: bold; color: #1e40af; margin-bottom: 8px;">💡 Mehrbesuche sind der Kernhebel im Gastro/Retail</div>
                    <div style="font-size: 13px; color: #3b82f6;">
                      Stammkunden-Aktivierung • Netzwerk-Effekt • Review-Booster
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://my2go.lovable.app/go" style="display: inline-block; background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                      Jetzt starten →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Disclaimer -->
              <p style="font-size: 12px; color: #888; text-align: center; border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
                Diese Analyse basiert auf Ihren Angaben. Die tatsächlichen Ergebnisse können variieren.<br>
                Ihre Angaben werden nur für die Analyse und das Zusenden des Reports verwendet.
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5;">
              <div style="font-size: 18px; font-weight: bold; color: #FF6B00; margin-bottom: 5px;">My 2Go</div>
              <div style="font-size: 13px; color: #666;">Das Loyalitäts-Netzwerk für Schweizer KMU</div>
              <div style="font-size: 11px; color: #888; margin-top: 10px;">
                2Go Media AG • Industriestrasse 19 • 5200 Brugg • partner@my2go.app
              </div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ReportEmailRequest = await req.json();

    // Validate required fields
    if (!data.recipientEmail || !data.recipientName || !data.companyName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending partner report to: ${data.recipientEmail} for company: ${data.companyName}`);
    console.log(`Mehrbesuche data included: ${!!data.mehrbesuche}`);

    const emailHtml = generateEmailHTML(data);

    const emailResponse = await resend.emails.send({
      from: "2Go Partner <partner@my2go.app>",
      to: [data.recipientEmail],
      subject: `🎯 Ihr 2Go Partner Fit-Check Report für ${data.companyName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending partner report email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
