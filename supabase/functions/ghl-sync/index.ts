import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
}

interface CreateSubAccountRequest {
  partnerId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  website?: string;
}

interface SyncContactRequest {
  locationId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, string>;
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

    if (!GHL_API_KEY || !GHL_AGENCY_ID) {
      console.error('Missing GHL credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'GHL credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { action, payload } = await req.json();

    console.log(`GHL Sync action: ${action}`, JSON.stringify(payload));

    switch (action) {
      case 'create-subaccount': {
        const { partnerId, name, email, phone, address, city, postalCode, website } = payload as CreateSubAccountRequest;

        // Check if partner already has a GHL location
        const { data: partner, error: partnerError } = await supabase
          .from('partners')
          .select('ghl_location_id, name')
          .eq('id', partnerId)
          .single();

        if (partnerError) {
          console.error('Partner fetch error:', partnerError);
          return new Response(
            JSON.stringify({ success: false, error: 'Partner not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (partner.ghl_location_id) {
          console.log('Partner already has GHL location:', partner.ghl_location_id);
          return new Response(
            JSON.stringify({ success: true, locationId: partner.ghl_location_id, existing: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create sub-account in GHL
        const ghlResponse = await fetch('https://services.leadconnectorhq.com/locations/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
          body: JSON.stringify({
            companyId: GHL_AGENCY_ID,
            name: name,
            email: email,
            phone: phone || '',
            address: address || '',
            city: city || '',
            country: 'CH',
            postalCode: postalCode || '',
            website: website || '',
            timezone: 'Europe/Zurich',
          }),
        });

        if (!ghlResponse.ok) {
          const errorText = await ghlResponse.text();
          console.error('GHL API error:', errorText);
          
          // Update partner with error status
          await supabase
            .from('partners')
            .update({ 
              ghl_sync_status: 'error',
              ghl_synced_at: new Date().toISOString()
            })
            .eq('id', partnerId);

          return new Response(
            JSON.stringify({ success: false, error: 'GHL API error', details: errorText }),
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
            ghl_synced_at: new Date().toISOString()
          })
          .eq('id', partnerId);

        if (updateError) {
          console.error('Partner update error:', updateError);
        }

        return new Response(
          JSON.stringify({ success: true, locationId, existing: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync-contact': {
        const { locationId, email, firstName, lastName, phone, tags, customFields } = payload as SyncContactRequest;

        if (!locationId || !email) {
          return new Response(
            JSON.stringify({ success: false, error: 'locationId and email are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // First check if contact exists
        const searchResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${locationId}&email=${encodeURIComponent(email)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28',
            },
          }
        );

        let contactId: string | null = null;
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.contact?.id) {
            contactId = searchData.contact.id;
            console.log('Existing contact found:', contactId);
          }
        }

        const contactPayload = {
          locationId,
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          phone: phone || '',
          tags: tags || ['radio2go-app', 'signup'],
          customField: customFields || {},
          source: 'Radio2Go App',
        };

        let ghlResponse;
        
        if (contactId) {
          // Update existing contact
          ghlResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28',
            },
            body: JSON.stringify(contactPayload),
          });
        } else {
          // Create new contact
          ghlResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28',
            },
            body: JSON.stringify(contactPayload),
          });
        }

        if (!ghlResponse.ok) {
          const errorText = await ghlResponse.text();
          console.error('GHL contact sync error:', errorText);
          return new Response(
            JSON.stringify({ success: false, error: 'Contact sync failed', details: errorText }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const contactData = await ghlResponse.json();
        console.log('Contact synced successfully:', contactData.contact?.id || contactId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            contactId: contactData.contact?.id || contactId,
            updated: !!contactId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync-signup': {
        // Sync a new user signup to ALL active partner locations
        const { email, firstName, lastName, phone, userId } = payload;

        if (!email) {
          return new Response(
            JSON.stringify({ success: false, error: 'email is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get all active partners with GHL location IDs
        const { data: partners, error: partnersError } = await supabase
          .from('partners')
          .select('id, name, ghl_location_id')
          .eq('is_active', true)
          .not('ghl_location_id', 'is', null);

        if (partnersError) {
          console.error('Error fetching partners:', partnersError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch partners' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Syncing signup to ${partners?.length || 0} GHL locations`);

        const syncResults = [];

        for (const partner of partners || []) {
          if (!partner.ghl_location_id) continue;

          try {
            const contactPayload = {
              locationId: partner.ghl_location_id,
              email,
              firstName: firstName || '',
              lastName: lastName || '',
              phone: phone || '',
              tags: ['radio2go-app', 'signup', 'new-user'],
              source: 'Radio2Go App Signup',
            };

            // Create contact in this location
            const ghlResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
              },
              body: JSON.stringify(contactPayload),
            });

            if (ghlResponse.ok) {
              const data = await ghlResponse.json();
              syncResults.push({ 
                partnerId: partner.id, 
                partnerName: partner.name,
                success: true, 
                contactId: data.contact?.id 
              });
              console.log(`Contact synced to ${partner.name}: ${data.contact?.id}`);
            } else {
              const errorText = await ghlResponse.text();
              // Check if it's a duplicate error (contact already exists)
              if (errorText.includes('duplicate') || errorText.includes('already exists')) {
                syncResults.push({ 
                  partnerId: partner.id, 
                  partnerName: partner.name,
                  success: true, 
                  existing: true 
                });
              } else {
                console.error(`Failed to sync to ${partner.name}:`, errorText);
                syncResults.push({ 
                  partnerId: partner.id, 
                  partnerName: partner.name,
                  success: false, 
                  error: errorText 
                });
              }
            }
          } catch (err) {
            console.error(`Error syncing to ${partner.name}:`, err);
            syncResults.push({ 
              partnerId: partner.id, 
              partnerName: partner.name,
              success: false, 
              error: String(err) 
            });
          }
        }

        const successCount = syncResults.filter(r => r.success).length;
        console.log(`Signup sync complete: ${successCount}/${syncResults.length} successful`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            syncedCount: successCount,
            totalPartners: syncResults.length,
            results: syncResults
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-location': {
        const { locationId } = payload;

        const ghlResponse = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
        });

        if (!ghlResponse.ok) {
          const errorText = await ghlResponse.text();
          console.error('GHL location fetch error:', errorText);
          return new Response(
            JSON.stringify({ success: false, error: 'Location fetch failed' }),
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
          JSON.stringify({ success: false, error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('GHL Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
