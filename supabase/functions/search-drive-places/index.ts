import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: "Google Places API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { query, lat, lng } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const locationBias = lat && lng ? `&location=${lat},${lng}&radius=50000` : "";
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query.trim())}&region=ch&language=de${locationBias}&key=${googleApiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = data.results.slice(0, 5).map((p: any) => ({
      id: p.place_id,
      name: p.name,
      address: p.formatted_address,
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
      category: p.types?.[0],
    }));

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
