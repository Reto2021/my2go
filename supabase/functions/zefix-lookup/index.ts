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
  registryOfCommerceId?: number;
  address?: {
    street?: string;
    houseNumber?: string;
    swissZipCode?: string;
    city?: string;
  };
  persons?: {
    name: string;
    role: string;
    signature?: string;
  }[];
}

// Map of registry IDs to cantonal subdomains
const REGISTRY_DOMAINS: Record<number, string> = {
  100: 'zh', // Zürich
  150: 'be', // Bern
  170: 'lu', // Luzern
  190: 'ur', // Uri
  200: 'sz', // Schwyz
  210: 'ow', // Obwalden
  220: 'nw', // Nidwalden
  230: 'gl', // Glarus
  240: 'zg', // Zug
  270: 'so', // Solothurn
  280: 'bs', // Basel-Stadt
  290: 'bl', // Basel-Landschaft
  300: 'sh', // Schaffhausen
  310: 'ar', // Appenzell Ausserrhoden
  320: 'ai', // Appenzell Innerrhoden
  330: 'sg', // St. Gallen
  340: 'gr', // Graubünden
  400: 'ag', // Aargau
  410: 'tg', // Thurgau
  500: 'ti', // Ticino
  550: 'vd', // Vaud
  560: 'vs', // Valais
  600: 'ne', // Neuchâtel
  620: 'ge', // Genève
  670: 'ju', // Jura
  250: 'fr', // Fribourg
};

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
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
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
    
    // Helper function to scrape cantonal register for address and persons
    async function scrapeCantonalRegister(companyUid: string, registryId: number): Promise<{
      address?: { street?: string; houseNumber?: string; swissZipCode?: string; city?: string };
      persons?: { name: string; role: string; signature?: string }[];
    } | null> {
      if (!firecrawlApiKey) {
        console.log('Firecrawl API key not configured, skipping scrape');
        return null;
      }
      
      // Get cantonal domain
      const canton = REGISTRY_DOMAINS[registryId];
      if (!canton) {
        console.log(`Unknown registry ID: ${registryId}`);
        return null;
      }
      
      // Format UID for URL (CHE-XXX.XXX.XXX)
      const cleanUid = companyUid.replace(/[^0-9]/g, '');
      const formattedUid = `CHE-${cleanUid.slice(3, 6)}.${cleanUid.slice(6, 9)}.${cleanUid.slice(9, 12)}`;
      
      // Build cantonal register URL
      const registerUrl = `https://${canton}.chregister.ch/cr-portal/auszug/auszug.xhtml?uid=${formattedUid}`;
      console.log(`Scraping cantonal register: ${registerUrl}`);
      
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: registerUrl,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 3000, // Wait for dynamic content
          }),
        });
        
        if (!scrapeResponse.ok) {
          console.error(`Firecrawl error: ${scrapeResponse.status}`);
          return null;
        }
        
        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
        
        console.log(`Scraped content length: ${markdown.length}`);
        console.log(`Scraped content preview: ${markdown.slice(0, 1000)}`);
        
        // Parse address from markdown
        const address = parseAddressFromMarkdown(markdown);
        
        // Parse persons from markdown
        const persons = parsePersonsFromMarkdown(markdown);
        
        console.log(`Parsed address:`, JSON.stringify(address));
        console.log(`Parsed ${persons.length} persons`);
        
        return { address, persons };
      } catch (e) {
        console.error('Scraping error:', e);
        return null;
      }
    }
    
    // Parse address from HR markdown content
    function parseAddressFromMarkdown(markdown: string): { street?: string; houseNumber?: string; swissZipCode?: string; city?: string } | undefined {
      // Common patterns in Swiss HR extracts
      // Look for address section - typically after "Sitz" or "Domizil" or in a specific format
      
      // Pattern 1: "Strasse Nr., PLZ Ort" format
      const addressMatch = markdown.match(/(?:Sitz|Domizil|Adresse|c\/o)[:\s]*([^\n]+)/i);
      if (addressMatch) {
        const addressLine = addressMatch[1].trim();
        // Try to parse "Strasse Nr., PLZ Ort" or "Strasse Nr., CH-PLZ Ort"
        const parsed = parseSwissAddress(addressLine);
        if (parsed) return parsed;
      }
      
      // Pattern 2: Look for PLZ + City pattern anywhere
      const plzCityMatch = markdown.match(/(\d{4})\s+([A-ZÄÖÜa-zäöü][A-ZÄÖÜa-zäöü\s-]+?)(?:\s*\n|\s*$|\s*,)/);
      if (plzCityMatch) {
        return {
          swissZipCode: plzCityMatch[1],
          city: plzCityMatch[2].trim()
        };
      }
      
      return undefined;
    }
    
    function parseSwissAddress(line: string): { street?: string; houseNumber?: string; swissZipCode?: string; city?: string } | undefined {
      // Pattern: "Bahnhofstrasse 10, 5000 Aarau" or "Bahnhofstrasse 10, CH-5000 Aarau"
      const fullMatch = line.match(/^(.+?)\s+(\d+[a-zA-Z]?)\s*,\s*(?:CH-)?(\d{4})\s+(.+?)$/);
      if (fullMatch) {
        return {
          street: fullMatch[1].trim(),
          houseNumber: fullMatch[2].trim(),
          swissZipCode: fullMatch[3],
          city: fullMatch[4].trim()
        };
      }
      
      // Pattern without house number: "Hauptstrasse, 5000 Aarau"
      const noNumberMatch = line.match(/^(.+?)\s*,\s*(?:CH-)?(\d{4})\s+(.+?)$/);
      if (noNumberMatch) {
        return {
          street: noNumberMatch[1].trim(),
          swissZipCode: noNumberMatch[2],
          city: noNumberMatch[3].trim()
        };
      }
      
      return undefined;
    }
    
    // Parse persons/organs from HR markdown content
    function parsePersonsFromMarkdown(markdown: string): { name: string; role: string; signature?: string }[] {
      const persons: { name: string; role: string; signature?: string }[] = [];
      
      // Look for person entries - common patterns in Swiss HR extracts
      // Pattern: Name, Role, possibly signature type
      
      // Common role keywords
      const rolePatterns = [
        /(?:Verwaltungsrat|VR|Präsident|Vizepräsident|Mitglied|Geschäftsführer|Direktor|CEO|CFO|Sekretär|Prokurist)[^:]*:\s*([^,\n]+)/gi,
        /([A-ZÄÖÜ][a-zäöü]+(?:\s+[A-ZÄÖÜ][a-zäöü]+)+)\s*,\s*(Präsident|Mitglied|Geschäftsführer|Direktor|Einzelunterschrift|Kollektivunterschrift)/gi,
      ];
      
      // Try to find the "Organe" or "Zeichnungsberechtigte" section
      const organeSection = markdown.match(/(?:Organe|Zeichnungsberechtigte|Personen)[^\n]*\n([\s\S]*?)(?:\n\n|\n#|$)/i);
      const searchText = organeSection ? organeSection[1] : markdown;
      
      // Pattern: "Name Vorname, Rolle, Unterschrift"
      const personLines = searchText.match(/([A-ZÄÖÜ][a-zäöü]+(?:\s+[A-ZÄÖÜ][a-zäöü]+)+)\s*,?\s*((?:Präsident|Mitglied|Geschäftsführer|Direktor|Sekretär)[^,\n]*)/gi);
      
      if (personLines) {
        for (const line of personLines) {
          const match = line.match(/([A-ZÄÖÜ][a-zäöü]+(?:\s+[A-ZÄÖÜ][a-zäöü]+)+)\s*,?\s*((?:Präsident|Mitglied|Geschäftsführer|Direktor|Sekretär)[^,\n]*)/i);
          if (match) {
            // Check for signature type
            const signatureMatch = line.match(/(Einzelunterschrift|Kollektivunterschrift\s*zu\s*\w+|Kollektivunterschrift)/i);
            persons.push({
              name: match[1].trim(),
              role: match[2].trim(),
              signature: signatureMatch ? signatureMatch[1].trim() : undefined
            });
          }
        }
      }
      
      // Deduplicate by name
      const seen = new Set<string>();
      return persons.filter(p => {
        if (seen.has(p.name)) return false;
        seen.add(p.name);
        return true;
      });
    }
    
    if (Array.isArray(results)) {
      // For the first result only, try to scrape the cantonal register (to avoid timeout)
      const detailPromises = results.slice(0, 3).map(async (c: any, index: number) => {
        let address = c.address;
        let persons: { name: string; role: string; signature?: string }[] | undefined;
        
        // Only scrape the first result to avoid timeouts
        if (index === 0 && c.uid && c.registryOfCommerceId) {
          const scraped = await scrapeCantonalRegister(c.uid, c.registryOfCommerceId);
          if (scraped) {
            if (scraped.address) address = scraped.address;
            if (scraped.persons && scraped.persons.length > 0) persons = scraped.persons;
          }
        }
        
        return {
          uid: c.uid || c.chid || c.ehpiNumber || '',
          name: c.name || c.shabName || '',
          legalSeat: c.legalSeat || c.seat || '',
          legalForm: c.legalForm?.name?.de || c.legalForm?.shortName?.de || c.legalFormId || '',
          status: c.status,
          registryOfCommerceId: c.registryOfCommerceId,
          address: address ? {
            street: address.street || address.addressLine1 || '',
            houseNumber: address.houseNumber || address.buildingNumber || '',
            swissZipCode: address.swissZipCode || address.postCode || address.zip || '',
            city: address.city || address.town || c.legalSeat || ''
          } : undefined,
          persons
        };
      });
      
      companies = await Promise.all(detailPromises);
      
      // Add remaining results without scraping
      if (results.length > 3) {
        const remaining = results.slice(3).map((c: any) => ({
          uid: c.uid || c.chid || c.ehpiNumber || '',
          name: c.name || c.shabName || '',
          legalSeat: c.legalSeat || c.seat || '',
          legalForm: c.legalForm?.name?.de || c.legalForm?.shortName?.de || c.legalFormId || '',
          status: c.status,
          registryOfCommerceId: c.registryOfCommerceId,
          address: undefined,
          persons: undefined
        }));
        companies = [...companies, ...remaining];
      }
    } else if (data && (data.uid || data.name)) {
      // Single result - scrape details
      let address = data.address;
      let persons: { name: string; role: string; signature?: string }[] | undefined;
      
      if (data.uid && data.registryOfCommerceId) {
        const scraped = await scrapeCantonalRegister(data.uid, data.registryOfCommerceId);
        if (scraped) {
          if (scraped.address) address = scraped.address;
          if (scraped.persons && scraped.persons.length > 0) persons = scraped.persons;
        }
      }
      
      companies = [{
        uid: data.uid || data.chid || data.ehpiNumber || '',
        name: data.name || data.shabName || '',
        legalSeat: data.legalSeat || '',
        legalForm: data.legalForm?.name?.de || data.legalForm?.shortName?.de || data.legalFormId || '',
        status: data.status,
        registryOfCommerceId: data.registryOfCommerceId,
        address: address ? {
          street: address.street || address.addressLine1 || '',
          houseNumber: address.houseNumber || address.buildingNumber || '',
          swissZipCode: address.swissZipCode || address.postCode || address.zip || '',
          city: address.city || address.town || data.legalSeat || ''
        } : undefined,
        persons
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