import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
          prompt: `Extract business information from this website. Return a JSON object with these fields:
            - name: the business/company name
            - description: a short description of the business (max 200 chars)
            - short_description: a very short tagline (max 80 chars)
            - category: the type of business (e.g., Restaurant, Café, Bäckerei, Fitness, Mode, Kosmetik, Handwerk, Dienstleistung)
            - address_street: street name without number
            - address_number: street number
            - postal_code: postal/zip code
            - city: city name
            - phone: phone number
            - email: email address
            - opening_hours: opening hours as text
            - instagram: Instagram handle or URL
            - facebook: Facebook page URL
          Only include fields if you find the information. Return null for missing fields.`
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

    // Build partner info from scraped data
    const partnerInfo = {
      name: extractedData.name || metadata.title || null,
      description: extractedData.description || metadata.description || null,
      short_description: extractedData.short_description || null,
      category: extractedData.category || null,
      address_street: extractedData.address_street || null,
      address_number: extractedData.address_number || null,
      postal_code: extractedData.postal_code || null,
      city: extractedData.city || null,
      phone: extractedData.phone || null,
      email: extractedData.email || null,
      website: formattedUrl,
      instagram: extractedData.instagram || null,
      facebook: extractedData.facebook || null,
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