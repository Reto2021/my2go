import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaceSearchRequest {
  name: string;
  address_street?: string;
  address_number?: string;
  postal_code?: string;
  city?: string;
  country?: string;
}

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  formatted_phone_number?: string;
  website?: string;
  lat?: number;
  lng?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!googleApiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Google Places API nicht konfiguriert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PlaceSearchRequest = await req.json();
    const { name, address_street, address_number, postal_code, city, country = 'CH' } = body;

    if (!name || name.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firmenname erforderlich (min. 2 Zeichen)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query from available fields
    const queryParts = [name.trim()];
    
    if (address_street) {
      const fullAddress = address_number 
        ? `${address_street} ${address_number}` 
        : address_street;
      queryParts.push(fullAddress);
    }
    
    if (postal_code) queryParts.push(postal_code);
    if (city) queryParts.push(city);
    if (country && country !== 'CH') queryParts.push(country);

    const searchQuery = queryParts.join(', ');
    console.log(`Searching Google Places for: ${searchQuery}`);

    // Use Places API Text Search
    const searchResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&region=ch&language=de&key=${googleApiKey}`
    );

    if (!searchResponse.ok) {
      console.error('Google Places API error:', await searchResponse.text());
      return new Response(
        JSON.stringify({ success: false, error: 'Google Places API Fehler' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    
    if (searchData.status === 'ZERO_RESULTS' || !searchData.results || searchData.results.length === 0) {
      console.log('No Google Places results found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          results: [],
          message: 'Keine Ergebnisse gefunden. Versuche einen anderen Suchbegriff.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (searchData.status !== 'OK') {
      console.error('Google Places status:', searchData.status, searchData.error_message);
      return new Response(
        JSON.stringify({ success: false, error: `Google API: ${searchData.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get details for top results (max 3)
    const topResults = searchData.results.slice(0, 3);
    const detailedResults: PlaceResult[] = [];

    for (const place of topResults) {
      const placeId = place.place_id;
      
      try {
        // Fetch additional details
        const detailsResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,rating,user_ratings_total,formatted_phone_number,website,geometry&language=de&key=${googleApiKey}`
        );
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          
          if (detailsData.status === 'OK' && detailsData.result) {
            const result = detailsData.result;
            detailedResults.push({
              place_id: result.place_id,
              name: result.name,
              formatted_address: result.formatted_address,
              rating: result.rating,
              user_ratings_total: result.user_ratings_total,
              formatted_phone_number: result.formatted_phone_number,
              website: result.website,
              lat: result.geometry?.location?.lat,
              lng: result.geometry?.location?.lng,
            });
          }
        }
      } catch (e) {
        console.log('Could not fetch place details for', placeId, e);
        // Add basic info if details fail
        detailedResults.push({
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
        });
      }
    }

    console.log(`Found ${detailedResults.length} place results`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: detailedResults,
        query: searchQuery
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error searching place:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
