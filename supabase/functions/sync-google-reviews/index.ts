import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GooglePlaceDetails {
  result?: {
    rating?: number;
    user_ratings_total?: number;
    name?: string;
  };
  status: string;
  error_message?: string;
}

interface Partner {
  id: string;
  name: string;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!googleApiKey) {
      console.error("GOOGLE_PLACES_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Google Places API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all partners with a google_place_id
    const { data: partners, error: fetchError } = await supabase
      .from("partners")
      .select("id, name, google_place_id, google_rating, google_review_count")
      .not("google_place_id", "is", null)
      .eq("is_active", true);

    if (fetchError) {
      console.error("Error fetching partners:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch partners", details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!partners || partners.length === 0) {
      console.log("No partners with google_place_id found");
      return new Response(
        JSON.stringify({ message: "No partners with Google Place ID found", updated: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${partners.length} partners with Google Place IDs`);

    const results: { partnerId: string; name: string; success: boolean; rating?: number; reviewCount?: number; error?: string }[] = [];

    // Process each partner
    for (const partner of partners as Partner[]) {
      if (!partner.google_place_id) continue;

      try {
        console.log(`Fetching Google reviews for: ${partner.name} (${partner.google_place_id})`);

        // Call Google Places API
        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(partner.google_place_id)}&fields=rating,user_ratings_total,name&key=${googleApiKey}`;

        const response = await fetch(placeDetailsUrl);
        const data: GooglePlaceDetails = await response.json();

        if (data.status !== "OK") {
          console.error(`Google API error for ${partner.name}:`, data.status, data.error_message);
          results.push({
            partnerId: partner.id,
            name: partner.name,
            success: false,
            error: `Google API: ${data.status} - ${data.error_message || "Unknown error"}`,
          });
          continue;
        }

        const newRating = data.result?.rating ?? null;
        const newReviewCount = data.result?.user_ratings_total ?? null;

        // Only update if values changed
        if (newRating !== partner.google_rating || newReviewCount !== partner.google_review_count) {
          const { error: updateError } = await supabase
            .from("partners")
            .update({
              google_rating: newRating,
              google_review_count: newReviewCount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", partner.id);

          if (updateError) {
            console.error(`Error updating partner ${partner.name}:`, updateError);
            results.push({
              partnerId: partner.id,
              name: partner.name,
              success: false,
              error: updateError.message,
            });
            continue;
          }

          console.log(`Updated ${partner.name}: rating=${newRating}, reviews=${newReviewCount}`);
          results.push({
            partnerId: partner.id,
            name: partner.name,
            success: true,
            rating: newRating ?? undefined,
            reviewCount: newReviewCount ?? undefined,
          });
        } else {
          console.log(`No changes for ${partner.name}`);
          results.push({
            partnerId: partner.id,
            name: partner.name,
            success: true,
            rating: newRating ?? undefined,
            reviewCount: newReviewCount ?? undefined,
          });
        }

        // Rate limiting: wait 100ms between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (partnerError) {
        console.error(`Error processing partner ${partner.name}:`, partnerError);
        results.push({
          partnerId: partner.id,
          name: partner.name,
          success: false,
          error: partnerError instanceof Error ? partnerError.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`Sync complete: ${successCount} successful, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Google Reviews sync completed",
        total: partners.length,
        successful: successCount,
        failed: failCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
