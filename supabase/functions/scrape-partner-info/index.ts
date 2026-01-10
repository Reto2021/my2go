import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to search for Google Place ID using Perplexity
async function findGooglePlaceId(businessName: string, city: string, perplexityKey: string): Promise<string | null> {
  if (!perplexityKey || !businessName) return null;
  
  try {
    console.log(`Searching Google Place ID for: ${businessName}, ${city}`);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: 'Du bist ein Assistent der Google Place IDs findet. Antworte NUR mit der Place ID (Format: ChIJ...) oder "NOT_FOUND" wenn keine gefunden wurde. Keine weiteren Erklärungen.' 
          },
          { 
            role: 'user', 
            content: `Finde die Google Place ID für: "${businessName}" in ${city || 'Schweiz'}. Die Place ID beginnt mit "ChIJ" und ist etwa 27 Zeichen lang. Suche auf Google Maps.` 
          }
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    
    console.log('Perplexity response for Place ID:', content);
    
    // Extract Place ID if it matches the pattern (starts with ChIJ)
    const placeIdMatch = content.match(/ChIJ[a-zA-Z0-9_-]{20,30}/);
    if (placeIdMatch) {
      console.log('Found Place ID:', placeIdMatch[0]);
      return placeIdMatch[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error finding Place ID:', error);
    return null;
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
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl nicht konfiguriert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping partner info from:', formattedUrl);

    // Use Firecrawl with extract for structured data
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
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

    // Try to find Google Place ID using Perplexity
    let googlePlaceId: string | null = null;
    if (perplexityKey && businessName) {
      googlePlaceId = await findGooglePlaceId(businessName, city, perplexityKey);
    } else if (!perplexityKey) {
      console.log('PERPLEXITY_API_KEY not configured, skipping Place ID search');
    }

    // Build partner info from scraped data
    const partnerInfo = {
      name: businessName,
      description: extractedData.description || metadata.description || null,
      short_description: extractedData.short_description || null,
      category: extractedData.category || null,
      address_street: extractedData.address_street || null,
      address_number: extractedData.address_number || null,
      postal_code: extractedData.postal_code || null,
      city: city,
      phone: extractedData.phone || null,
      email: extractedData.email || null,
      contact_name: extractedData.contact_name || null,
      website: formattedUrl,
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
