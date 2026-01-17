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

// Format UID properly: CHE130920325 -> CHE-130.920.325
function formatUidForUrl(uid: string): string {
  const digits = uid.replace(/[^0-9]/g, '');
  if (digits.length !== 9) {
    console.log(`Invalid UID digits length: ${digits.length} for ${uid}`);
    return uid;
  }
  return `CHE-${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { query, uid, fetchDetails, registryOfCommerceId } = body;
    
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

    const credentials = btoa(`${apiUser}:${apiPassword}`);
    const authHeader = `Basic ${credentials}`;
    const baseUrl = 'https://www.zefix.admin.ch/ZefixPublicREST/api/v1';

    // ==========================================
    // MODE 1: Fetch details for a selected company (with scraping)
    // ==========================================
    if (fetchDetails && uid && registryOfCommerceId) {
      console.log(`Fetching details for UID: ${uid}, Registry: ${registryOfCommerceId}`);
      
      const scraped = await scrapeCantonalRegister(uid, registryOfCommerceId, firecrawlApiKey);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          address: scraped?.address,
          persons: scraped?.persons 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // MODE 2: Quick search (no scraping)
    // ==========================================
    if (!query && !uid) {
      return new Response(
        JSON.stringify({ error: 'Query or UID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Zefix lookup: query="${query}", uid="${uid}"`);

    const searchTerm = uid || query;
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

    // If exact search fails, try similar search
    if (!response.ok || response.status === 204) {
      console.log('Trying similar search...');
      
      response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          name: searchTerm,
          searchType: "similar",
          maxEntries: 10,
          offset: 0
        })
      });
      
      console.log(`Zefix similar search response status: ${response.status}`);
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
    
    const results = data.list || data.results || data;
    let companies: ZefixCompany[] = [];
    
    if (Array.isArray(results)) {
      companies = results.slice(0, 10).map((c: any) => ({
        uid: c.uid || c.chid || c.ehpiNumber || '',
        name: c.name || c.shabName || '',
        legalSeat: c.legalSeat || c.seat || '',
        legalForm: c.legalForm?.name?.de || c.legalForm?.shortName?.de || c.legalFormId || '',
        status: c.status,
        registryOfCommerceId: c.registryOfCommerceId
      }));
    } else if (data && (data.uid || data.name)) {
      companies = [{
        uid: data.uid || data.chid || data.ehpiNumber || '',
        name: data.name || data.shabName || '',
        legalSeat: data.legalSeat || '',
        legalForm: data.legalForm?.name?.de || data.legalForm?.shortName?.de || data.legalFormId || '',
        status: data.status,
        registryOfCommerceId: data.registryOfCommerceId
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
  
  // ==========================================
  // Helper: Scrape cantonal register
  // ==========================================
  async function scrapeCantonalRegister(
    companyUid: string, 
    registryId: number,
    firecrawlApiKey: string | undefined
  ): Promise<{
    address?: { street?: string; houseNumber?: string; swissZipCode?: string; city?: string };
    persons?: { name: string; role: string; signature?: string }[];
  } | null> {
    if (!firecrawlApiKey) {
      console.log('Firecrawl API key not configured');
      return null;
    }
    
    const canton = REGISTRY_DOMAINS[registryId];
    if (!canton) {
      console.log(`Unknown registry ID: ${registryId}`);
      return null;
    }
    
    const formattedUid = formatUidForUrl(companyUid);
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
          waitFor: 5000,
        }),
      });
      
      if (!scrapeResponse.ok) {
        const errText = await scrapeResponse.text();
        console.error(`Firecrawl error ${scrapeResponse.status}: ${errText.slice(0, 200)}`);
        return null;
      }
      
      const scrapeData = await scrapeResponse.json();
      const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
      
      console.log(`Scraped content length: ${markdown.length}`);
      console.log(`Scraped content preview: ${markdown.slice(0, 2000)}`);
      
      const address = parseAddressFromMarkdown(markdown);
      const persons = parsePersonsFromMarkdown(markdown);
      
      console.log(`Parsed address:`, JSON.stringify(address));
      console.log(`Parsed ${persons.length} persons:`, JSON.stringify(persons.slice(0, 3)));
      
      return { address, persons };
    } catch (e) {
      console.error('Scraping error:', e);
      return null;
    }
  }
  
  function parseAddressFromMarkdown(markdown: string): { street?: string; houseNumber?: string; swissZipCode?: string; city?: string } | undefined {
    // Look for common HR address patterns
    // Pattern: "Domizil: Strasse Nr, PLZ Ort" or address in table format
    
    // Pattern 1: Look for "Domizil" or "Sitz" line
    const domizilMatch = markdown.match(/(?:Domizil|Geschäftsadresse|Adresse)[:\s]*([^\n]+)/i);
    if (domizilMatch) {
      const parsed = parseSwissAddress(domizilMatch[1].trim());
      if (parsed && parsed.swissZipCode) return parsed;
    }
    
    // Pattern 2: Look for address pattern with PLZ
    // e.g., "Bahnhofstrasse 10, 5200 Brugg" or "Bahnhofstrasse 10\n5200 Brugg"
    const addressPattern = /([A-ZÄÖÜa-zäöü][A-ZÄÖÜa-zäöü\s-]+(?:strasse|weg|platz|gasse|allee|ring))\s*(\d+[a-zA-Z]?)?\s*[,\n]\s*(?:CH-)?(\d{4})\s+([A-ZÄÖÜa-zäöü][A-ZÄÖÜa-zäöü\s-]+)/i;
    const addressMatch = markdown.match(addressPattern);
    if (addressMatch) {
      return {
        street: addressMatch[1].trim(),
        houseNumber: addressMatch[2]?.trim() || '',
        swissZipCode: addressMatch[3],
        city: addressMatch[4].trim()
      };
    }
    
    // Pattern 3: Just find PLZ + City
    const plzMatch = markdown.match(/(?:CH-)?(\d{4})\s+([A-ZÄÖÜ][a-zäöü]+(?:\s+[A-Za-zäöü]+)?)/);
    if (plzMatch) {
      return {
        swissZipCode: plzMatch[1],
        city: plzMatch[2].trim()
      };
    }
    
    return undefined;
  }
  
  function parseSwissAddress(line: string): { street?: string; houseNumber?: string; swissZipCode?: string; city?: string } | undefined {
    // "Bahnhofstrasse 10, 5000 Aarau" or "Bahnhofstrasse 10, CH-5000 Aarau"
    const fullMatch = line.match(/^(.+?)\s+(\d+[a-zA-Z]?)\s*,\s*(?:CH-)?(\d{4})\s+(.+?)$/);
    if (fullMatch) {
      return {
        street: fullMatch[1].trim(),
        houseNumber: fullMatch[2].trim(),
        swissZipCode: fullMatch[3],
        city: fullMatch[4].trim()
      };
    }
    
    // Without house number
    const noNumMatch = line.match(/^(.+?)\s*,\s*(?:CH-)?(\d{4})\s+(.+?)$/);
    if (noNumMatch) {
      return {
        street: noNumMatch[1].trim(),
        swissZipCode: noNumMatch[2],
        city: noNumMatch[3].trim()
      };
    }
    
    return undefined;
  }
  
  function parsePersonsFromMarkdown(markdown: string): { name: string; role: string; signature?: string }[] {
    const persons: { name: string; role: string; signature?: string }[] = [];
    
    // Swiss HR person patterns - typically in format:
    // "Nachname Vorname, von Ort, in Ort, Rolle, Unterschrift"
    // or table rows with Name | Role | Signature
    
    // Pattern 1: Look for common role keywords with names
    const roleKeywords = [
      'Präsident', 'Vizepräsident', 'Mitglied', 'Sekretär',
      'Geschäftsführer', 'Direktor', 'Vorsitzender',
      'Verwaltungsratspräsident', 'CEO', 'CFO', 'COO'
    ];
    
    const rolePattern = new RegExp(
      `([A-ZÄÖÜ][a-zäöü]+(?:\\s+[A-ZÄÖÜ][a-zäöü]+)+)\\s*,?\\s*(${roleKeywords.join('|')})([^\\n]*)`,
      'gi'
    );
    
    let match;
    while ((match = rolePattern.exec(markdown)) !== null) {
      const name = match[1].trim();
      const role = match[2].trim();
      const rest = match[3] || '';
      
      // Check for signature type
      let signature: string | undefined;
      if (rest.includes('Einzelunterschrift') || rest.includes('Einzelzeichnung')) {
        signature = 'Einzelunterschrift';
      } else if (rest.includes('Kollektivunterschrift') || rest.includes('Kollektivzeichnung')) {
        const kollMatch = rest.match(/Kollektiv(?:unterschrift|zeichnung)\s*(?:zu\s*(\w+))?/i);
        signature = kollMatch ? `Kollektivunterschrift${kollMatch[1] ? ' zu ' + kollMatch[1] : ''}` : 'Kollektivunterschrift';
      }
      
      persons.push({ name, role, signature });
    }
    
    // Pattern 2: Look for "Eingetragene Personen" section
    const personSection = markdown.match(/(?:Eingetragene Personen|Organe|Zeichnungsberechtigte)[:\s]*\n([\s\S]*?)(?:\n\n|\n#|$)/i);
    if (personSection) {
      const sectionText = personSection[1];
      
      // Try to find "Name, Role" patterns
      const linePattern = /([A-ZÄÖÜ][a-zäöü]+(?:\s+[A-ZÄÖÜ][a-zäöü]+){1,3})\s*[,;]\s*((?:Präsident|Mitglied|Geschäftsführer|Direktor)[^,;\n]*)/gi;
      
      while ((match = linePattern.exec(sectionText)) !== null) {
        const name = match[1].trim();
        const role = match[2].trim();
        
        // Avoid duplicates
        if (!persons.find(p => p.name === name)) {
          persons.push({ name, role });
        }
      }
    }
    
    return persons;
  }
});