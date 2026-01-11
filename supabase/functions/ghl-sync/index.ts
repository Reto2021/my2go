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
    const { action, ...payload } = await req.json();

    console.log(`GHL Sync Action: ${action}`, { partnerId: payload.partnerId });

    switch (action) {
      case 'create-subaccount': {
        const data = payload as CreateSubAccountRequest;
        
        // Check if partner already has a GHL location
        const { data: partner, error: fetchError } = await supabase
          .from('partners')
          .select('id, name, ghl_location_id, ghl_sync_status')
          .eq('id', data.partnerId)
          .single();

        if (fetchError) {
          console.error('Error fetching partner:', fetchError);
          return new Response(
            JSON.stringify({ error: 'Partner not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        const { locationId, contact } = payload;

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
