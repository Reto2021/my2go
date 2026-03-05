import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now?: boolean;
  };
  business_status?: string;
}

interface SearchResult {
  google_place_id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  address_street: string;
  address_number: string;
  category: string;
  rating: number | null;
  review_count: number | null;
  lat: number | null;
  lng: number | null;
  types: string[];
}

// Map Google place types to our categories
function mapToCategory(types: string[]): string {
  const typeMap: Record<string, string> = {
    'restaurant': 'Restaurant',
    'cafe': 'Café',
    'bar': 'Bar',
    'bakery': 'Bäckerei',
    'meal_takeaway': 'Take-Away',
    'meal_delivery': 'Take-Away',
    'gym': 'Fitness',
    'spa': 'Wellness & Spa',
    'beauty_salon': 'Kosmetik & Beauty',
    'hair_care': 'Coiffeur',
    'clothing_store': 'Mode & Bekleidung',
    'shoe_store': 'Schuhe & Accessoires',
    'jewelry_store': 'Schmuck & Uhren',
    'florist': 'Blumen & Garten',
    'supermarket': 'Lebensmittel',
    'grocery_or_supermarket': 'Lebensmittel',
    'car_repair': 'Autowerkstatt',
    'gas_station': 'Tankstelle',
    'lodging': 'Hotel',
    'food': 'Restaurant',
    'store': 'Einzelhandel',
    'health': 'Gesundheit',
    'doctor': 'Gesundheit',
    'dentist': 'Gesundheit',
    'pharmacy': 'Gesundheit',
    'physiotherapist': 'Gesundheit',
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }
  
  return 'Sonstiges';
}

// Parse Swiss address format
function parseAddress(formattedAddress: string): { street: string; number: string; postal: string; city: string } {
  // Swiss address format: "Strasse Nr, PLZ Stadt, Schweiz"
  const parts = formattedAddress.split(',').map(p => p.trim());
  
  let street = '';
  let number = '';
  let postal = '';
  let city = '';
  
  if (parts.length >= 2) {
    // First part: Street + Number
    const streetPart = parts[0];
    const streetMatch = streetPart.match(/^(.+?)\s+(\d+[a-zA-Z]?)$/);
    if (streetMatch) {
      street = streetMatch[1];
      number = streetMatch[2];
    } else {
      street = streetPart;
    }
    
    // Second part: PLZ Stadt
    const cityPart = parts[1];
    const postalMatch = cityPart.match(/^(\d{4})\s+(.+)$/);
    if (postalMatch) {
      postal = postalMatch[1];
      city = postalMatch[2];
    } else {
      city = cityPart;
    }
  }
  
  return { street, number, postal, city };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check: require valid JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const authClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { city, category, radius = 5000 } = await req.json();

    if (!city) {
      return new Response(
        JSON.stringify({ success: false, error: 'Stadt ist erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Google Places API nicht konfiguriert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching for businesses in: ${city}, category: ${category || 'all'}`);

    // First, geocode the city to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city + ', Schweiz')}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
      return new Response(
        JSON.stringify({ success: false, error: `Stadt "${city}" nicht gefunden` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = geocodeData.results[0].geometry.location;
    console.log(`Geocoded ${city} to:`, location);

    // Build search query
    let searchQuery = category ? `${category} in ${city}` : `Geschäfte in ${city}`;
    
    // Use Text Search API for more comprehensive results
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${location.lat},${location.lng}&radius=${radius}&language=de&key=${apiKey}`;
    
    console.log('Searching Google Places...');
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', searchData);
      return new Response(
        JSON.stringify({ success: false, error: `Google Places Fehler: ${searchData.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: SearchResult[] = (searchData.results || [])
      .filter((place: PlaceResult) => place.business_status !== 'CLOSED_PERMANENTLY')
      .map((place: PlaceResult) => {
        const parsed = parseAddress(place.formatted_address);
        return {
          google_place_id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          city: parsed.city || city,
          postal_code: parsed.postal,
          address_street: parsed.street,
          address_number: parsed.number,
          category: mapToCategory(place.types),
          rating: place.rating || null,
          review_count: place.user_ratings_total || null,
          lat: place.geometry?.location?.lat || null,
          lng: place.geometry?.location?.lng || null,
          types: place.types,
        };
      });

    console.log(`Found ${results.length} businesses`);

    // Get next page token if available
    const nextPageToken = searchData.next_page_token || null;

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: results,
        total: results.length,
        nextPageToken,
        searchLocation: { lat: location.lat, lng: location.lng }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error searching partners:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
