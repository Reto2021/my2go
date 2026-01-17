import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZefixCompany {
  uid: string;
  name: string;
  legalSeat: string;
  legalForm: string;
  status: string;
  address?: {
    street?: string;
    houseNumber?: string;
    swissZipCode?: string;
    city?: string;
  };
  cantonalExcerptWeb?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, uid } = await req.json();
    
    if (!query && !uid) {
      return new Response(
        JSON.stringify({ error: 'Query or UID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Zefix lookup: query="${query}", uid="${uid}"`);

    // Zefix API (Swiss Commercial Register)
    // Note: The official Zefix API requires registration, but there's a public search endpoint
    const searchUrl = uid 
      ? `https://www.zefix.ch/ZefixREST/api/v1/company/uid/${encodeURIComponent(uid)}`
      : `https://www.zefix.ch/ZefixREST/api/v1/company/search?name=${encodeURIComponent(query)}&activeOnly=true&maxEntries=10`;

    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'My2Go Partner Quiz/1.0'
      }
    });

    if (!response.ok) {
      console.error(`Zefix API error: ${response.status}`);
      
      // Return mock data for demo purposes when API is unavailable
      if (query) {
        return new Response(
          JSON.stringify({
            companies: [],
            message: 'Zefix-Suche nicht verfügbar. Bitte manuell eingeben.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const data = await response.json();
    
    // Transform to our format
    let companies: ZefixCompany[] = [];
    
    if (Array.isArray(data)) {
      companies = data.map((c: any) => ({
        uid: c.uid || c.chid,
        name: c.name,
        legalSeat: c.legalSeat,
        legalForm: c.legalForm?.name?.de || c.legalFormId,
        status: c.status,
        address: c.address ? {
          street: c.address.street,
          houseNumber: c.address.houseNumber,
          swissZipCode: c.address.swissZipCode,
          city: c.address.city
        } : undefined,
        cantonalExcerptWeb: c.cantonalExcerptWeb
      }));
    } else if (data && data.uid) {
      companies = [{
        uid: data.uid || data.chid,
        name: data.name,
        legalSeat: data.legalSeat,
        legalForm: data.legalForm?.name?.de || data.legalFormId,
        status: data.status,
        address: data.address ? {
          street: data.address.street,
          houseNumber: data.address.houseNumber,
          swissZipCode: data.address.swissZipCode,
          city: data.address.city
        } : undefined,
        cantonalExcerptWeb: data.cantonalExcerptWeb
      }];
    }

    console.log(`Found ${companies.length} companies`);

    return new Response(
      JSON.stringify({ companies }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Zefix lookup error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Lookup failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        companies: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
