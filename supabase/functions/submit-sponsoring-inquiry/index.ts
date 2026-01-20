import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SponsoringInquiry {
  company: string;
  contact_name: string;
  email: string;
  phone?: string;
  desired_level?: string;
  engagement_area?: string;
  message?: string;
}

// =============================================
// SECURITY: Input validation and sanitization
// =============================================

// Email regex for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// HTML escape to prevent XSS in emails
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

// Truncate and sanitize string input
function sanitizeInput(input: string | undefined, maxLength: number): string {
  if (!input) return '';
  return escapeHtml(input.trim().slice(0, maxLength));
}

// Validate email format
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 255;
}

// Field length limits
const LIMITS = {
  company: 100,
  contact_name: 100,
  email: 255,
  phone: 30,
  message: 2000,
  desired_level: 50,
  engagement_area: 50
} as const;

const levelLabels: Record<string, string> = {
  bronze: "Bronze - CHF 500/Monat",
  silver: "Silber - CHF 1'000/Monat",
  gold: "Gold - CHF 2'500/Monat",
  platinum: "Platinum - CHF 5'000/Monat",
  custom: "Individuelles Paket",
};

const areaLabels: Record<string, string> = {
  reward: "🎁 Reward-Sponsor",
  radio: "📻 Radio-Sponsor",
  event: "🎉 Event-Sponsor",
  partner: "🤝 Partner-Sponsor",
  community: "💚 Community-Sponsor",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInquiry: SponsoringInquiry = await req.json();

    // =============================================
    // SECURITY: Validate and sanitize all inputs
    // =============================================
    
    // Validate required fields
    if (!rawInquiry.company?.trim() || !rawInquiry.contact_name?.trim() || !rawInquiry.email?.trim()) {
      return new Response(
        JSON.stringify({ error: "Pflichtfelder fehlen" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    if (!isValidEmail(rawInquiry.email.trim())) {
      return new Response(
        JSON.stringify({ error: "Ungültige E-Mail-Adresse" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize all inputs for HTML rendering (prevents XSS in emails)
    const sanitized = {
      company: sanitizeInput(rawInquiry.company, LIMITS.company),
      contact_name: sanitizeInput(rawInquiry.contact_name, LIMITS.contact_name),
      email: rawInquiry.email.trim().slice(0, LIMITS.email), // Don't escape email
      phone: sanitizeInput(rawInquiry.phone, LIMITS.phone) || null,
      desired_level: sanitizeInput(rawInquiry.desired_level, LIMITS.desired_level) || null,
      engagement_area: sanitizeInput(rawInquiry.engagement_area, LIMITS.engagement_area) || null,
      message: sanitizeInput(rawInquiry.message, LIMITS.message) || null,
    };

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert inquiry into database (using sanitized data)
    const { data: savedInquiry, error: dbError } = await supabase
      .from("sponsoring_inquiries")
      .insert({
        company: sanitized.company,
        contact_name: sanitized.contact_name,
        email: sanitized.email,
        phone: sanitized.phone,
        desired_level: sanitized.desired_level,
        engagement_area: sanitized.engagement_area,
        message: sanitized.message,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Fehler beim Speichern der Anfrage");
    }

    // Prepare email content (already sanitized for HTML)
    const levelText = sanitized.desired_level ? levelLabels[sanitized.desired_level] || sanitized.desired_level : "Nicht angegeben";
    const areaText = sanitized.engagement_area ? areaLabels[sanitized.engagement_area] || sanitized.engagement_area : "Nicht angegeben";

    // Send notification email to team (using sanitized data - already HTML-escaped)
    const teamEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Neue Sponsoring-Anfrage!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">Kontaktdaten</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 140px;">Unternehmen:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${sanitized.company}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Ansprechperson:</td>
              <td style="padding: 8px 0; color: #1f2937;">${sanitized.contact_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">E-Mail:</td>
              <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(sanitized.email)}" style="color: #2563eb;">${escapeHtml(sanitized.email)}</a></td>
            </tr>
            ${sanitized.phone ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Telefon:</td>
              <td style="padding: 8px 0;"><a href="tel:${sanitized.phone}" style="color: #2563eb;">${sanitized.phone}</a></td>
            </tr>
            ` : ''}
          </table>
          
          <h2 style="color: #1f2937; margin-top: 24px;">Interesse</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 140px;">Level:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${levelText}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Bereich:</td>
              <td style="padding: 8px 0; color: #1f2937;">${areaText}</td>
            </tr>
          </table>
          
          ${sanitized.message ? `
          <h2 style="color: #1f2937; margin-top: 24px;">Nachricht</h2>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #374151; white-space: pre-wrap;">${sanitized.message}</p>
          </div>
          ` : ''}
          
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Anfrage-ID: ${savedInquiry.id}<br>
              Eingegangen am: ${new Date().toLocaleString('de-CH', { timeZone: 'Europe/Zurich' })}
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email to team
    await resend.emails.send({
      from: "2Go Sponsoring <noreply@my2go.ch>",
      to: ["sponsoring@my2go.ch"],
      subject: `🎉 Neue Sponsoring-Anfrage von ${sanitized.company}`,
      html: teamEmailHtml,
    });

    // Send confirmation email to inquirer
    const firstName = sanitized.contact_name.split(' ')[0] || 'Interessent';
    const confirmationHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f, #2d5a87); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Vielen Dank für Ihre Anfrage!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Liebe/r ${firstName},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            wir haben Ihre Sponsoring-Anfrage erhalten und freuen uns über Ihr Interesse an einer Partnerschaft mit 2Go!
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Unser Team wird sich innerhalb von 48 Stunden bei Ihnen melden, um die nächsten Schritte zu besprechen.
          </p>
          
          <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="color: #92400e; margin: 0; font-weight: 600;">📋 Ihre Anfrage:</p>
            <p style="color: #92400e; margin: 8px 0 0 0;">
              Level: ${levelText}<br>
              Bereich: ${areaText}
            </p>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Bei Fragen erreichen Sie uns jederzeit unter <a href="mailto:sponsoring@my2go.ch" style="color: #2563eb;">sponsoring@my2go.ch</a>.
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
            Mit freundlichen Grüssen<br>
            <strong>Das 2Go Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 16px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} 2Go Media AG | <a href="https://my2go.ch" style="color: #9ca3af;">my2go.ch</a>
          </p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: "2Go Sponsoring <noreply@my2go.ch>",
      to: [sanitized.email],
      subject: "Ihre Sponsoring-Anfrage bei 2Go",
      html: confirmationHtml,
    });

    console.log("Sponsoring inquiry saved and emails sent:", savedInquiry.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: savedInquiry.id,
        message: "Anfrage erfolgreich gesendet" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in submit-sponsoring-inquiry:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Ein Fehler ist aufgetreten" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
