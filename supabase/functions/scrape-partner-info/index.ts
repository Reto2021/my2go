import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to check if input looks like a URL
function isLikelyUrl(input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  // Check if it starts with http/https or looks like a domain
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }
  // Check if it looks like a domain (e.g., www.example.com or example.ch)
  const domainPattern = /^(www\.)?[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i;
  if (domainPattern.test(trimmed) && !trimmed.includes(' ')) {
    return true;
  }
  return false;
}

// Helper function to search for business website using Firecrawl search
async function searchForBusinessWebsite(searchQuery: string, apiKey: string): Promise<string | null> {
  try {
    console.log(`Searching for business website: ${searchQuery}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${searchQuery} official website`,
        limit: 5,
        lang: 'de',
        country: 'ch',
      }),
    });

    if (!response.ok) {
      console.error('Firecrawl search error:', await response.text());
      return null;
    }

    const data = await response.json();
    console.log('Search results:', JSON.stringify(data));

    // Get the search results
    const results = data.data || [];
    
    if (results.length === 0) {
      console.log('No search results found');
      return null;
    }

    // Filter out common non-business sites and prefer official websites
    const excludeDomains = [
      'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com',
      'tripadvisor.', 'yelp.', 'google.com/maps', 'google.ch/maps',
      'youtube.com', 'wikipedia.org', 'local.ch', 'search.ch',
      'gastrogate.com', 'lunchgate.ch', 'qype.ch'
    ];

    // Find the first result that looks like an official business website
    for (const result of results) {
      const url = result.url || '';
      const lowerUrl = url.toLowerCase();
      
      // Skip excluded domains
      const isExcluded = excludeDomains.some(domain => lowerUrl.includes(domain));
      if (isExcluded) {
        console.log(`Skipping excluded domain: ${url}`);
        continue;
      }

      console.log(`Found potential business website: ${url}`);
      return url;
    }

    // If no official site found, return the first non-social result
    const firstResult = results[0]?.url;
    if (firstResult) {
      console.log(`Using first result as fallback: ${firstResult}`);
      return firstResult;
    }

    return null;
  } catch (error) {
    console.error('Error searching for business:', error);
    return null;
  }
}

// Helper function to search for Google Place ID using Google Places API
async function findGooglePlaceId(businessName: string, city: string, googleApiKey: string): Promise<{ placeId: string | null; contactName?: string; phone?: string }> {
  if (!googleApiKey || !businessName) return { placeId: null };
  
  try {
    const searchQuery = city ? `${businessName} ${city}` : businessName;
    console.log(`Searching Google Places for: ${searchQuery}`);
    
    // Use Places API Text Search
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&region=ch&language=de&key=${googleApiKey}`
    );

    if (!response.ok) {
      console.error('Google Places API error:', await response.text());
      return { placeId: null };
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.log('No Google Places results found');
      return { placeId: null };
    }

    const place = data.results[0];
    const placeId = place.place_id;
    console.log('Found Google Place ID:', placeId);

    // Optionally get more details (phone number, etc.)
    if (placeId) {
      try {
        const detailsResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,name&language=de&key=${googleApiKey}`
        );
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          if (detailsData.status === 'OK' && detailsData.result) {
            return {
              placeId,
              phone: detailsData.result.formatted_phone_number || undefined,
            };
          }
        }
      } catch (e) {
        console.log('Could not fetch place details:', e);
      }
    }

    return { placeId };
  } catch (error) {
    console.error('Error finding Place ID:', error);
    return { placeId: null };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL oder Suchbegriff erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const googlePlacesApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl nicht konfiguriert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetUrl: string;
    const inputTrimmed = url.trim();

    // Check if input is a URL or a search term
    if (isLikelyUrl(inputTrimmed)) {
      // It's a URL, format it properly
      targetUrl = inputTrimmed;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = `https://${targetUrl}`;
      }
      console.log('Input recognized as URL:', targetUrl);
    } else {
      // It's a search term, do a web search first
      console.log('Input recognized as search term:', inputTrimmed);
      
      const foundUrl = await searchForBusinessWebsite(inputTrimmed, apiKey);
      
      if (!foundUrl) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Keine Website für "${inputTrimmed}" gefunden. Versuche einen genaueren Suchbegriff oder gib die URL direkt ein.` 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      targetUrl = foundUrl;
      console.log('Found website via search:', targetUrl);
    }

    console.log('Scraping partner info from:', targetUrl);

    // Use Firecrawl with extract for structured data
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ['markdown', 'extract'],
        extract: {
          prompt: `Extrahiere Geschäftsinformationen von dieser Website. WICHTIG: Alle Beschreibungen müssen auf DEUTSCH sein!
          
          Gib ein JSON-Objekt mit diesen Feldern zurück:
            - name: der Geschäfts-/Firmenname
            - description: eine kurze Beschreibung des Geschäfts auf DEUTSCH (max 200 Zeichen)
            - short_description: ein sehr kurzer Slogan auf DEUTSCH (max 80 Zeichen)
            - category: die Art des Geschäfts (z.B. Restaurant, Café, Bäckerei, Fitness, Mode, Kosmetik, Handwerk, Dienstleistung, Bar, Wellness & Spa, Hotel)
            - address_street: Strassenname ohne Nummer
            - address_number: Hausnummer
            - postal_code: Postleitzahl
            - city: Stadt/Ort
            - phone: Telefonnummer
            - email: E-Mail-Adresse
            - contact_name: Name einer Kontaktperson (Inhaber, Geschäftsführer, Ansprechpartner)
            - opening_hours: Öffnungszeiten als Text
            - instagram: Instagram-Handle oder URL
            - facebook: Facebook-Seiten-URL
          
          Nur Felder einfügen, wenn die Information gefunden wird. Für fehlende Felder null zurückgeben.
          WICHTIG: description und short_description MÜSSEN auf Deutsch sein!`
        },
        onlyMainContent: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Scraping fehlgeschlagen' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Firecrawl response received');

    // Extract the data from Firecrawl response
    const scrapedData = data.data || data;
    const extractedData = scrapedData.extract || {};
    const metadata = scrapedData.metadata || {};

    const businessName = extractedData.name || metadata.title || null;
    const city = extractedData.city || null;

    // Try to find Google Place ID using Google Places API
    let googlePlaceId: string | null = null;
    let googlePhone: string | null = null;
    
    if (googlePlacesApiKey && businessName) {
      const placeResult = await findGooglePlaceId(businessName, city, googlePlacesApiKey);
      googlePlaceId = placeResult.placeId;
      googlePhone = placeResult.phone || null;
    } else if (!googlePlacesApiKey) {
      console.log('GOOGLE_PLACES_API_KEY not configured, skipping Place ID search');
    }

    // Build partner info from scraped data
    // Use Google phone if scraped phone is not available
    const partnerInfo = {
      name: businessName,
      description: extractedData.description || metadata.description || null,
      short_description: extractedData.short_description || null,
      category: extractedData.category || null,
      address_street: extractedData.address_street || null,
      address_number: extractedData.address_number || null,
      postal_code: extractedData.postal_code || null,
      city: city,
      phone: extractedData.phone || googlePhone || null,
      email: extractedData.email || null,
      contact_name: extractedData.contact_name || null,
      website: targetUrl,
      instagram: extractedData.instagram || null,
      facebook: extractedData.facebook || null,
      google_place_id: googlePlaceId,
    };

    console.log('Extracted partner info:', JSON.stringify(partnerInfo));

    return new Response(
      JSON.stringify({ success: true, data: partnerInfo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping partner info:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
