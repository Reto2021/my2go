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

    // Use Firecrawl with branding and JSON extraction
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: [
          'markdown',
          'branding',
          {
            type: 'json',
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
          }
        ],
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

    // Extract the data from Firecrawl response
    const scrapedData = data.data || data;
    const extractedJson = scrapedData.json || {};
    const branding = scrapedData.branding || {};

    // Build partner info from scraped data
    const partnerInfo = {
      name: extractedJson.name || null,
      description: extractedJson.description || null,
      short_description: extractedJson.short_description || null,
      category: extractedJson.category || null,
      address_street: extractedJson.address_street || null,
      address_number: extractedJson.address_number || null,
      postal_code: extractedJson.postal_code || null,
      city: extractedJson.city || null,
      phone: extractedJson.phone || null,
      email: extractedJson.email || null,
      website: formattedUrl,
      instagram: extractedJson.instagram || null,
      facebook: extractedJson.facebook || null,
      brand_color: branding.colors?.primary || null,
      logo_url: branding.images?.logo || branding.logo || null,
    };

    console.log('Extracted partner info:', partnerInfo);

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
