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
    const { query, uid, fetchDetails, registryOfCommerceId, legalSeat } = body;
    
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
      console.log(`Fetching details for UID: ${uid}, Registry: ${registryOfCommerceId}, LegalSeat: ${legalSeat}`);
      
      const scraped = await scrapeCantonalRegister(uid, registryOfCommerceId, firecrawlApiKey, legalSeat);
      
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
  // Helper: Lookup PLZ from city via geo.admin.ch API
  // ==========================================
  async function lookupPlzFromCity(cityName: string): Promise<string | null> {
    try {
      const searchUrl = `https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(cityName)}&type=locations&origins=zipcode&limit=1`;
      console.log(`Looking up PLZ for city: ${cityName}`);
      
      const response = await fetch(searchUrl);
      if (!response.ok) {
        console.error(`geo.admin.ch API error: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        // Result label is typically "PLZ Ortschaft" format
        const label = result.attrs?.label || result.label || '';
        const plzMatch = label.match(/^(\d{4})/);
        if (plzMatch) {
          console.log(`Found PLZ ${plzMatch[1]} for ${cityName}`);
          return plzMatch[1];
        }
      }
      
      return null;
    } catch (e) {
      console.error('PLZ lookup error:', e);
      return null;
    }
  }
  
  // ==========================================
  // Helper: Scrape cantonal register
  // ==========================================
  async function scrapeCantonalRegister(
    companyUid: string, 
    registryId: number,
    firecrawlApiKey: string | undefined,
    legalSeat: string | undefined
  ): Promise<{
    address?: { street?: string; houseNumber?: string; swissZipCode?: string; city?: string };
    persons?: { name: string; role: string; signature?: string }[];
  } | null> {
    let address: { street?: string; houseNumber?: string; swissZipCode?: string; city?: string } | undefined;
    let persons: { name: string; role: string; signature?: string }[] = [];
    
    // Try scraping first if Firecrawl key is available
    if (firecrawlApiKey) {
      const canton = REGISTRY_DOMAINS[registryId];
      if (canton) {
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
          
          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
            
            console.log(`Scraped content length: ${markdown.length}`);
            console.log(`Scraped content preview: ${markdown.slice(0, 2000)}`);
            
            address = parseAddressFromMarkdown(markdown);
            persons = parsePersonsFromMarkdown(markdown);
            
            console.log(`Parsed address:`, JSON.stringify(address));
            console.log(`Parsed ${persons.length} persons:`, JSON.stringify(persons.slice(0, 3)));
          } else {
            const errText = await scrapeResponse.text();
            console.error(`Firecrawl error ${scrapeResponse.status}: ${errText.slice(0, 200)}`);
          }
        } catch (e) {
          console.error('Scraping error:', e);
        }
      } else {
        console.log(`Unknown registry ID: ${registryId}`);
      }
    }
    
    // Fallback: If no PLZ found via scraping but we have legalSeat, lookup PLZ from city
    if ((!address || !address.swissZipCode) && legalSeat) {
      console.log(`No PLZ from scraping, falling back to geo.admin.ch lookup for: ${legalSeat}`);
      const plz = await lookupPlzFromCity(legalSeat);
      if (plz) {
        address = {
          ...address,
          swissZipCode: plz,
          city: address?.city || legalSeat
        };
      } else if (!address) {
        address = { city: legalSeat };
      }
    }
    
    return { address, persons };
  }
  
  function parseAddressFromMarkdown(markdown: string): { street?: string; houseNumber?: string; swissZipCode?: string; city?: string } | undefined {
    // Pattern 1: Table format from HR - look for "Registered address" section
    // Format: "| 11 |  | Industriestrasse 19<br> 5200 Brugg AG |"
    // We want the LAST (most recent) address entry
    const tablePattern = /\|\s*\d+\s*\|[^|]*\|\s*([^|]+?)<br>\s*(?:CH-)?(\d{4})\s+([A-Za-zÄÖÜäöü\s]+?)\s*\|/g;
    let lastMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;
    while ((match = tablePattern.exec(markdown)) !== null) {
      lastMatch = match;
    }
    if (lastMatch) {
      const streetPart = lastMatch[1].trim();
      const streetMatch = streetPart.match(/^(.+?)\s+(\d+[a-zA-Z]?)$/);
      console.log(`Found table address: ${streetPart}, ${lastMatch[2]} ${lastMatch[3]}`);
      return {
        street: streetMatch ? streetMatch[1].trim() : streetPart,
        houseNumber: streetMatch ? streetMatch[2] : '',
        swissZipCode: lastMatch[2],
        city: lastMatch[3].trim()
      };
    }
    
    // Pattern 2: Look for "Domizil" or "Sitz" line
    const domizilMatch = markdown.match(/(?:Domizil|Geschäftsadresse|Adresse)[:\s]*([^\n]+)/i);
    if (domizilMatch) {
      const parsed = parseSwissAddress(domizilMatch[1].trim());
      if (parsed && parsed.swissZipCode) return parsed;
    }
    
    // Pattern 3: Look for address pattern with PLZ
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
    
    // Pattern 4: Just find PLZ + City
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
    
    console.log('=== Starting person parsing ===');
    console.log('Markdown length:', markdown.length);
    
    // Step 1: Try to find the structured table format from Swiss HR
    // Format: | Nr | Date | Name, Location, Role, Signature |
    // Example: "| 1 | 07.01.2025 | Müller Hans, von Zürich, in Bern, Geschäftsführer, Einzelunterschrift |"
    
    const tableRowPattern = /\|\s*\d+\s*\|[^|]+\|\s*([^|]+)\s*\|/g;
    let tableMatch;
    
    while ((tableMatch = tableRowPattern.exec(markdown)) !== null) {
      const cellContent = tableMatch[1].trim();
      
      // Skip header rows and junk
      if (cellContent.includes('Datum') || cellContent.includes('Nr.') || cellContent.length < 10) {
        continue;
      }
      
      // Parse the cell content: "Nachname Vorname, von Ort, in Ort, Rolle, Unterschrift"
      const parts = cellContent.split(',').map(p => p.trim());
      
      if (parts.length >= 2) {
        // First part should be the name (Nachname Vorname format)
        const namePart = parts[0];
        
        // Validate name: should be 2-4 words, no special patterns
        if (isValidPersonName(namePart)) {
          // Look for role in remaining parts
          const roleInfo = findRoleInParts(parts.slice(1));
          
          if (roleInfo.role) {
            // Check for duplicates
            if (!persons.find(p => p.name === namePart)) {
              console.log(`Table: Found person "${namePart}" with role "${roleInfo.role}"`);
              persons.push({
                name: namePart,
                role: roleInfo.role,
                signature: roleInfo.signature
              });
            }
          }
        }
      }
    }
    
    // Step 2: Look for structured "Organe" or "Eingetragene Personen" sections
    const organSectionPattern = /(?:Verwaltungsrat|Geschäftsleitung|Organe|Eingetragene Personen)[:\s]*\n([\s\S]*?)(?:\n\n|\n##|\n#|$)/gi;
    let sectionMatch;
    
    while ((sectionMatch = organSectionPattern.exec(markdown)) !== null) {
      const sectionContent = sectionMatch[1];
      
      // Look for lines with Name + Role pattern
      // Format: "Müller Hans, Präsident" or "Hans Müller - Geschäftsführer"
      const linePattern = /^[\s*-]*([A-ZÄÖÜ][a-zäöüé]+(?:\s+[A-ZÄÖÜ][a-zäöüé]+){1,3})[\s,;:-]+(Präsident(?:in)?|Vizepräsident(?:in)?|Mitglied|Geschäftsführer(?:in)?|Direktor(?:in)?|Sekretär(?:in)?|Vorsitzende[r]?)/gmi;
      
      let lineMatch;
      while ((lineMatch = linePattern.exec(sectionContent)) !== null) {
        const name = lineMatch[1].trim();
        const role = lineMatch[2].trim();
        
        if (isValidPersonName(name) && !persons.find(p => p.name === name)) {
          console.log(`Section: Found person "${name}" with role "${role}"`);
          persons.push({ name, role });
        }
      }
    }
    
    // Step 3: Fallback - look for explicit role patterns in free text
    // But only if we haven't found anyone yet
    if (persons.length === 0) {
      const freeTextPattern = /([A-ZÄÖÜ][a-zäöüé]+\s+[A-ZÄÖÜ][a-zäöüé]+(?:\s+[A-ZÄÖÜ][a-zäöüé]+)?)\s*[,]\s*(Präsident|Vizepräsident|Mitglied|Geschäftsführer|Direktor|Sekretär|Vorsitzender|Verwaltungsratspräsident)(?:in)?[,\s]*((?:Einzel|Kollektiv)(?:unterschrift|zeichnung)[^,\n]*)?/gi;
      
      let freeMatch;
      while ((freeMatch = freeTextPattern.exec(markdown)) !== null) {
        const name = freeMatch[1].trim();
        const role = freeMatch[2].trim();
        const signaturePart = freeMatch[3] || '';
        
        if (isValidPersonName(name) && !persons.find(p => p.name === name)) {
          let signature: string | undefined;
          if (signaturePart.toLowerCase().includes('einzelunterschrift') || signaturePart.toLowerCase().includes('einzelzeichnung')) {
            signature = 'Einzelunterschrift';
          } else if (signaturePart.toLowerCase().includes('kollektivunterschrift') || signaturePart.toLowerCase().includes('kollektivzeichnung')) {
            signature = 'Kollektivunterschrift';
          }
          
          console.log(`Fallback: Found person "${name}" with role "${role}"`);
          persons.push({ name, role, signature });
        }
      }
    }
    
    console.log(`=== Found ${persons.length} valid persons ===`);
    return persons;
  }
  
  function isValidPersonName(name: string): boolean {
    if (!name || name.length < 4) return false;
    
    const words = name.trim().split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;
    
    // Blacklist patterns
    const blacklist = [
      /cookie/i, /consent/i, /privacy/i, /policy/i, /website/i,
      /close/i, /cancel/i, /accept/i, /login/i, /site/i,
      /handelsregister/i, /auszug/i, /datum/i, /eintrag/i,
      /änderung/i, /löschung/i, /neueintrag/i, /mutation/i
    ];
    
    for (const pattern of blacklist) {
      if (pattern.test(name)) return false;
    }
    
    // Each word must look like a proper name part
    for (const word of words) {
      // Allow: Capital start, then lowercase, optionally hyphenated names
      if (!/^[A-ZÄÖÜ][a-zäöüé-]{1,25}$/.test(word)) return false;
    }
    
    return true;
  }
  
  function findRoleInParts(parts: string[]): { role?: string; signature?: string } {
    const roleKeywords = [
      'Präsident', 'Vizepräsident', 'Mitglied', 'Sekretär',
      'Geschäftsführer', 'Direktor', 'Vorsitzender',
      'Verwaltungsratspräsident', 'Präsidentin', 'Geschäftsführerin',
      'Direktorin', 'Sekretärin', 'Mitglied des Verwaltungsrat'
    ];
    
    let role: string | undefined;
    let signature: string | undefined;
    
    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      
      // Check for role
      for (const keyword of roleKeywords) {
        if (part.includes(keyword)) {
          role = keyword;
          break;
        }
      }
      
      // Check for signature type
      if (lowerPart.includes('einzelunterschrift') || lowerPart.includes('einzelzeichnung')) {
        signature = 'Einzelunterschrift';
      } else if (lowerPart.includes('kollektivunterschrift') || lowerPart.includes('kollektivzeichnung')) {
        signature = 'Kollektivunterschrift';
      }
    }
    
    return { role, signature };
  }
});