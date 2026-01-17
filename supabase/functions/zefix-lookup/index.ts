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
  status?: string;
  address?: {
    street?: string;
    houseNumber?: string;
    swissZipCode?: string;
    city?: string;
  };
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

    // Use the public Zefix search page API (no authentication required)
    // This endpoint is used by the Zefix website itself
    const searchTerm = uid || query;
    
    const searchUrl = `https://www.zefix.ch/ZefixPublicREST/api/v1/company/search`;
    
    const searchBody = {
      name: searchTerm,
      searchType: "exact", // or "similar"
      maxEntries: 10,
      offset: 0
    };

    console.log('Searching Zefix with body:', JSON.stringify(searchBody));

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; My2Go/1.0)'
      },
      body: JSON.stringify(searchBody)
    });

    console.log(`Zefix response status: ${response.status}`);

    if (!response.ok) {
      // Try alternative: the suggest endpoint
      console.log('Trying suggest endpoint...');
      
      const suggestUrl = `https://www.zefix.ch/ZefixPublicREST/api/v1/company/search/suggest?query=${encodeURIComponent(searchTerm)}`;
      
      const suggestResponse = await fetch(suggestUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; My2Go/1.0)'
        }
      });

      console.log(`Suggest response status: ${suggestResponse.status}`);

      if (suggestResponse.ok) {
        const suggestData = await suggestResponse.json();
        console.log('Suggest data:', JSON.stringify(suggestData).slice(0, 500));
        
        if (Array.isArray(suggestData) && suggestData.length > 0) {
          const companies: ZefixCompany[] = suggestData.slice(0, 10).map((c: any) => ({
            uid: c.uid || c.chid || '',
            name: c.name || c.value || '',
            legalSeat: c.legalSeat || c.seat || '',
            legalForm: c.legalForm || '',
            address: c.address ? {
              street: c.address.street,
              houseNumber: c.address.houseNumber,
              swissZipCode: c.address.swissZipCode,
              city: c.address.city
            } : undefined
          }));

          return new Response(
            JSON.stringify({ companies }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // If all else fails, return empty with message
      return new Response(
        JSON.stringify({
          companies: [],
          message: 'Keine Firma gefunden. Bitte manuell eingeben.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Search response:', JSON.stringify(data).slice(0, 500));
    
    // Transform to our format
    let companies: ZefixCompany[] = [];
    
    // Handle the response structure
    const results = data.list || data.results || data;
    
    if (Array.isArray(results)) {
      companies = results.map((c: any) => ({
        uid: c.uid || c.chid || '',
        name: c.name || '',
        legalSeat: c.legalSeat || c.seat || '',
        legalForm: c.legalForm?.name?.de || c.legalForm || c.legalFormId || '',
        status: c.status,
        address: c.address ? {
          street: c.address.street,
          houseNumber: c.address.houseNumber,
          swissZipCode: c.address.swissZipCode,
          city: c.address.city
        } : undefined
      }));
    } else if (data && (data.uid || data.name)) {
      companies = [{
        uid: data.uid || data.chid || '',
        name: data.name || '',
        legalSeat: data.legalSeat || '',
        legalForm: data.legalForm?.name?.de || data.legalForm || '',
        status: data.status,
        address: data.address ? {
          street: data.address.street,
          houseNumber: data.address.houseNumber,
          swissZipCode: data.address.swissZipCode,
          city: data.address.city
        } : undefined
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
