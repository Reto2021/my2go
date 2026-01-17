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
    
    // Helper function to fetch company details with address
    async function fetchCompanyDetails(companyUid: string, ehraid: number): Promise<any | null> {
      try {
        // First try by UID (format: CHE-123.456.789 or CHE123456789)
        if (companyUid) {
          const cleanUid = companyUid.replace(/[^A-Z0-9]/gi, '');
          const detailUrl = `${baseUrl}/company/uid/${cleanUid}`;
          console.log(`Fetching company details by UID: ${detailUrl}`);
          
          const detailResponse = await fetch(detailUrl, {
            headers: {
              'Accept': 'application/json',
              'Authorization': authHeader
            }
          });
          
          console.log(`Detail response for UID ${cleanUid}: ${detailResponse.status}`);
          
          if (detailResponse.ok) {
            const details = await detailResponse.json();
            console.log(`Details for ${cleanUid}:`, JSON.stringify(details).slice(0, 500));
            return details;
          }
        }
        
        // Fallback: try by ehraid
        if (ehraid) {
          const ehraIdUrl = `${baseUrl}/company/ehraid/${ehraid}`;
          console.log(`Fetching company details by ehraid: ${ehraIdUrl}`);
          
          const ehraIdResponse = await fetch(ehraIdUrl, {
            headers: {
              'Accept': 'application/json',
              'Authorization': authHeader
            }
          });
          
          console.log(`Detail response for ehraid ${ehraid}: ${ehraIdResponse.status}`);
          
          if (ehraIdResponse.ok) {
            const details = await ehraIdResponse.json();
            console.log(`Details for ehraid ${ehraid}:`, JSON.stringify(details).slice(0, 500));
            return details;
          }
        }
      } catch (e) {
        console.error(`Failed to fetch details for ${companyUid || ehraid}:`, e);
      }
      return null;
    }
    
    if (Array.isArray(results)) {
      // Fetch address details for top 5 results (limit to avoid timeouts)
      const detailPromises = results.slice(0, 5).map(async (c: any) => {
        let address = c.address;
        
        // If no address in search results, try to fetch details
        if (!address && (c.uid || c.ehraid)) {
          const details = await fetchCompanyDetails(c.uid || '', c.ehraid || 0);
          if (details?.address) {
            address = details.address;
          }
        }
        
        return {
          uid: c.uid || c.chid || c.ehpiNumber || '',
          name: c.name || c.shabName || '',
          legalSeat: c.legalSeat || c.seat || '',
          legalForm: c.legalForm?.name?.de || c.legalForm?.shortName?.de || c.legalFormId || '',
          status: c.status,
          address: address ? {
            street: address.street || address.addressLine1 || '',
            houseNumber: address.houseNumber || address.buildingNumber || '',
            swissZipCode: address.swissZipCode || address.postCode || address.zip || '',
            city: address.city || address.town || c.legalSeat || ''
          } : undefined
        };
      });
      
      companies = await Promise.all(detailPromises);
      
      // Add remaining results without details (if any)
      if (results.length > 5) {
        const remaining = results.slice(5).map((c: any) => ({
          uid: c.uid || c.chid || c.ehpiNumber || '',
          name: c.name || c.shabName || '',
          legalSeat: c.legalSeat || c.seat || '',
          legalForm: c.legalForm?.name?.de || c.legalForm?.shortName?.de || c.legalFormId || '',
          status: c.status,
          address: undefined
        }));
        companies = [...companies, ...remaining];
      }
    } else if (data && (data.uid || data.name)) {
      // Single result - fetch details
      let address = data.address;
      if (!address && (data.uid || data.ehraid)) {
        const details = await fetchCompanyDetails(data.uid || '', data.ehraid || 0);
        if (details?.address) {
          address = details.address;
        }
      }
      
      companies = [{
        uid: data.uid || data.chid || data.ehpiNumber || '',
        name: data.name || data.shabName || '',
        legalSeat: data.legalSeat || '',
        legalForm: data.legalForm?.name?.de || data.legalForm?.shortName?.de || data.legalFormId || '',
        status: data.status,
        address: address ? {
          street: address.street || address.addressLine1 || '',
          houseNumber: address.houseNumber || address.buildingNumber || '',
          swissZipCode: address.swissZipCode || address.postCode || address.zip || '',
          city: address.city || address.town || data.legalSeat || ''
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
