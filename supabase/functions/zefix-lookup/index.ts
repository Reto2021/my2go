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

    // Get credentials from environment
    const apiUser = Deno.env.get('ZEFIX_API_USER');
    const apiPassword = Deno.env.get('ZEFIX_API_PASSWORD');
    
    if (!apiUser || !apiPassword) {
      console.error('Missing Zefix API credentials');
      return new Response(
        JSON.stringify({ error: 'API credentials not configured', companies: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Basic Auth header
    const credentials = btoa(`${apiUser}:${apiPassword}`);
    const authHeader = `Basic ${credentials}`;

    console.log(`Zefix lookup: query="${query}", uid="${uid}"`);

    const searchTerm = uid || query;
    
    // Use the official Zefix Public REST API with authentication
    const baseUrl = 'https://www.zefix.admin.ch/ZefixPublicREST/api/v1';
    
    // First try company search
    const searchUrl = `${baseUrl}/company/search`;
    
    const searchBody = {
      name: searchTerm,
      searchType: "exact",
      maxEntries: 10,
      offset: 0
    };

    console.log('Searching Zefix with body:', JSON.stringify(searchBody));

    let response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(searchBody)
    });

    console.log(`Zefix search response status: ${response.status}`);

    // If exact search fails or returns no results, try similar search
    if (!response.ok || response.status === 204) {
      console.log('Trying similar search...');
      
      const similarBody = {
        name: searchTerm,
        searchType: "similar",
        maxEntries: 10,
        offset: 0
      };
      
      response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(similarBody)
      });
      
      console.log(`Zefix similar search response status: ${response.status}`);
    }

    // If still no results, try the suggest endpoint
    if (!response.ok || response.status === 204) {
      console.log('Trying suggest endpoint...');
      
      const suggestUrl = `${baseUrl}/company/search/suggest?query=${encodeURIComponent(searchTerm)}`;
      
      response = await fetch(suggestUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': authHeader
        }
      });

      console.log(`Zefix suggest response status: ${response.status}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zefix API error:', errorText);
      
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
    
    // Handle different response structures
    const results = data.list || data.results || data;
    
    if (Array.isArray(results)) {
      companies = results.map((c: any) => ({
        uid: c.uid || c.chid || c.ehpiNumber || '',
        name: c.name || c.shabName || '',
        legalSeat: c.legalSeat || c.seat || '',
        legalForm: c.legalForm?.name?.de || c.legalForm?.shortName?.de || c.legalFormId || '',
        status: c.status,
        address: c.address ? {
          street: c.address.street,
          houseNumber: c.address.houseNumber,
          swissZipCode: c.address.swissZipCode,
          city: c.address.city
        } : undefined
      }));
    } else if (data && (data.uid || data.name)) {
      // Single result
      companies = [{
        uid: data.uid || data.chid || data.ehpiNumber || '',
        name: data.name || data.shabName || '',
        legalSeat: data.legalSeat || '',
        legalForm: data.legalForm?.name?.de || data.legalForm?.shortName?.de || data.legalFormId || '',
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
