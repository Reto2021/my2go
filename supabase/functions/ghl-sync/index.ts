import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GHLSubAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
}

interface CreateSubAccountRequest {
  partnerId: string;
  partnerName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  website?: string;
  country?: string;
}

// Admin email for receiving sync failure notifications
const ADMIN_NOTIFICATION_EMAIL = 'admin@my2go.app';

/**
 * Send email notification for GHL sync failures
 */
async function sendSyncFailureNotification(
  resend: Resend,
  partnerName: string,
  partnerId: string,
  action: string,
  errorDetails: string
): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: 'My 2Go System <notifications@my2go.app>',
      to: [ADMIN_NOTIFICATION_EMAIL],
      subject: `⚠️ GHL Sync Fehler: ${partnerName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ GoHighLevel Sync Fehler</h1>
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #1e293b; margin-top: 0;">Partner Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; width: 120px;">Partner:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">${partnerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Partner ID:</td>
                <td style="padding: 8px 0; color: #1e293b; font-family: monospace; font-size: 12px;">${partnerId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Aktion:</td>
                <td style="padding: 8px 0; color: #1e293b;">${action}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Zeitpunkt:</td>
                <td style="padding: 8px 0; color: #1e293b;">${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Zurich' })}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #dc2626; margin-top: 0;">Fehlerdetails</h3>
            <pre style="background: #1e293b; color: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; white-space: pre-wrap;">${errorDetails}</pre>
          </div>
          
          <div style="text-align: center; color: #94a3b8; font-size: 12px;">
            <p>Diese E-Mail wurde automatisch vom My 2Go System generiert.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send notification email:', error);
    } else {
      console.log('Sync failure notification sent successfully');
    }
  } catch (emailError) {
    console.error('Error sending notification email:', emailError);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GHL_API_KEY = Deno.env.get('GOHIGHLEVEL_AGENCY_API_KEY');
    const GHL_AGENCY_ID = Deno.env.get('GOHIGHLEVEL_AGENCY_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!GHL_API_KEY || !GHL_AGENCY_ID) {
      console.error('Missing GoHighLevel credentials');
      return new Response(
        JSON.stringify({ error: 'GoHighLevel not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
    const { action, ...payload } = await req.json();

    console.log(`GHL Sync Action: ${action}`, { partnerId: payload.partnerId });

    switch (action) {
      case 'create-subaccount': {
        const data = payload as CreateSubAccountRequest;
        
        // Check if partner exists and has GHL access based on plan tier
        const { data: partner, error: fetchError } = await supabase
          .from('partners')
          .select('id, name, ghl_location_id, ghl_sync_status, plan_tier')
          .eq('id', data.partnerId)
          .single();

        if (fetchError) {
          console.error('Error fetching partner:', fetchError);
          return new Response(
            JSON.stringify({ error: 'Partner not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // GHL is only available for 'plus' (Growth) and 'radio' (Radio) plans
        const ghlEnabledTiers = ['plus', 'radio'];
        if (!partner.plan_tier || !ghlEnabledTiers.includes(partner.plan_tier)) {
          console.log(`GHL not available for plan tier: ${partner.plan_tier} - requires Growth or Radio plan`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'GHL integration requires Growth or Radio plan',
              currentTier: partner.plan_tier
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (partner.ghl_location_id) {
          console.log('Partner already has GHL location:', partner.ghl_location_id);
          return new Response(
            JSON.stringify({ 
              success: true, 
              locationId: partner.ghl_location_id,
              message: 'Sub-Account already exists' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create sub-account in GoHighLevel
        console.log('Creating GHL sub-account for:', data.partnerName);
        
        const ghlResponse = await fetch('https://services.leadconnectorhq.com/locations/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
          body: JSON.stringify({
            companyId: GHL_AGENCY_ID,
            name: data.partnerName,
            email: data.email,
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            country: data.country || 'CH',
            postalCode: data.postalCode || '',
            website: data.website || '',
            timezone: 'Europe/Zurich',
          }),
        });

        if (!ghlResponse.ok) {
          const errorText = await ghlResponse.text();
          console.error('GHL API Error:', ghlResponse.status, errorText);
          
          // Update partner sync status to error
          await supabase
            .from('partners')
            .update({ 
              ghl_sync_status: 'error',
              ghl_synced_at: new Date().toISOString()
            })
            .eq('id', data.partnerId);

          // Send email notification for sync failure
          if (resend) {
            await sendSyncFailureNotification(
              resend,
              data.partnerName,
              data.partnerId,
              'Sub-Account erstellen',
              `Status: ${ghlResponse.status}\n\n${errorText}`
            );
          }

          return new Response(
            JSON.stringify({ 
              error: 'Failed to create GoHighLevel sub-account',
              details: errorText 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const ghlData = await ghlResponse.json();
        const locationId = ghlData.location?.id || ghlData.id;

        console.log('GHL sub-account created:', locationId);

        // Update partner with GHL location ID
        const { error: updateError } = await supabase
          .from('partners')
          .update({
            ghl_location_id: locationId,
            ghl_sync_status: 'synced',
            ghl_synced_at: new Date().toISOString(),
          })
          .eq('id', data.partnerId);

        if (updateError) {
          console.error('Error updating partner:', updateError);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            locationId,
            message: 'Sub-Account erfolgreich erstellt!' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync-contact': {
        // Sync a customer/user to GHL location as a contact
        const { locationId, contact, partnerId, partnerName } = payload;

        if (!locationId) {
          return new Response(
            JSON.stringify({ error: 'No GHL location ID provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Syncing contact to GHL location:', locationId);

        const ghlResponse = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
          body: JSON.stringify({
            locationId,
            firstName: contact.firstName || '',
            lastName: contact.lastName || '',
            email: contact.email,
            phone: contact.phone || '',
            source: 'My 2Go App',
            tags: ['my2go', 'reward-customer'],
          }),
        });

        if (!ghlResponse.ok) {
          const errorText = await ghlResponse.text();
          console.error('GHL contact sync error:', errorText);

          // Send email notification for contact sync failure
          if (resend && partnerId && partnerName) {
            await sendSyncFailureNotification(
              resend,
              partnerName,
              partnerId,
              'Kontakt synchronisieren',
              `Kontakt: ${contact.email}\nStatus: ${ghlResponse.status}\n\n${errorText}`
            );
          }

          return new Response(
            JSON.stringify({ error: 'Failed to sync contact', details: errorText }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const contactData = await ghlResponse.json();
        console.log('Contact synced to GHL:', contactData.contact?.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            contactId: contactData.contact?.id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-location': {
        const { locationId } = payload;

        if (!locationId) {
          return new Response(
            JSON.stringify({ error: 'No location ID provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const ghlResponse = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
          },
        });

        if (!ghlResponse.ok) {
          const errorText = await ghlResponse.text();
          console.error('GHL get location error:', errorText);
          return new Response(
            JSON.stringify({ error: 'Failed to get location' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const locationData = await ghlResponse.json();
        return new Response(
          JSON.stringify({ success: true, location: locationData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('GHL Sync Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});