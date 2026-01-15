import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  language?: string;
}

interface GooglePlaceDetails {
  result?: {
    rating?: number;
    user_ratings_total?: number;
    name?: string;
    reviews?: GoogleReview[];
    geometry?: {
      location: {
        lat: number;
        lng: number;
      };
    };
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

interface SyncResult {
  partnerId: string;
  name: string;
  success: boolean;
  rating?: number;
  reviewCount?: number;
  reviewsSynced?: number;
  error?: string;
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

    // Parse request body for action-based routing
    let action = "sync-all";
    let partnerId: string | null = null;
    let placeId: string | null = null;
    let minRating = 4; // Default: only sync 4-5 star reviews

    try {
      const body = await req.json();
      action = body.action || "sync-all";
      partnerId = body.partnerId || null;
      placeId = body.placeId || null;
      minRating = body.minRating ?? 4;
    } catch {
      // No body or invalid JSON - default to sync-all
    }

    console.log(`Google Reviews Sync - Action: ${action}, PartnerId: ${partnerId}, MinRating: ${minRating}`);

    switch (action) {
      case "sync-single": {
        // Sync a single partner's Google reviews
        if (!partnerId) {
          return new Response(
            JSON.stringify({ error: "Partner ID required for single sync" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get partner's place_id
        const { data: partner, error: fetchError } = await supabase
          .from("partners")
          .select("id, name, google_place_id, google_rating, google_review_count")
          .eq("id", partnerId)
          .single();

        if (fetchError || !partner) {
          return new Response(
            JSON.stringify({ error: "Partner not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const targetPlaceId = placeId || partner.google_place_id;

        if (!targetPlaceId) {
          return new Response(
            JSON.stringify({ error: "No Google Place ID configured for this partner" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Sync this partner
        const result = await syncPartnerReviews(supabase, googleApiKey, partner, targetPlaceId, minRating);

        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "lookup-place": {
        // Search for a place by name/address
        const body = await req.json().catch(() => ({}));
        const query = body.query;

        if (!query) {
          return new Response(
            JSON.stringify({ error: "Search query required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address,rating,user_ratings_total&key=${googleApiKey}`;

        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
          console.error("Google Places search error:", data);
          return new Response(
            JSON.stringify({ error: "Search failed", details: data.status }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            candidates: data.candidates || [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync-all":
      default: {
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

        const results: SyncResult[] = [];

        // Process each partner
        for (const partner of partners as Partner[]) {
          if (!partner.google_place_id) continue;

          try {
            const result = await syncPartnerReviews(supabase, googleApiKey, partner, partner.google_place_id, minRating);
            results.push(result);

            // Rate limiting: wait 200ms between requests
            await new Promise((resolve) => setTimeout(resolve, 200));
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
        const totalReviewsSynced = results.reduce((acc, r) => acc + (r.reviewsSynced || 0), 0);

        console.log(`Sync complete: ${successCount} successful, ${failCount} failed, ${totalReviewsSynced} reviews synced`);

        return new Response(
          JSON.stringify({
            message: "Google Reviews sync completed",
            total: partners.length,
            successful: successCount,
            failed: failCount,
            totalReviewsSynced,
            results,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Helper function to extract clean place_id from various formats
 */
function extractPlaceId(input: string): string {
  // If it's already a clean place_id (starts with ChIJ or similar)
  if (/^[A-Za-z0-9_-]{20,}$/.test(input) && !input.includes("http")) {
    return input;
  }

  // Try to extract from URL
  const placeIdMatch = input.match(/place_id[=:]([A-Za-z0-9_-]+)/);
  if (placeIdMatch) {
    return placeIdMatch[1];
  }

  return input;
}

/**
 * Sync a single partner's Google reviews (rating + individual reviews)
 */
async function syncPartnerReviews(
  supabase: any,
  googleApiKey: string,
  partner: Partner,
  placeIdInput: string,
  minRating: number = 4
): Promise<SyncResult> {
  console.log(`Fetching Google reviews for: ${partner.name} (${placeIdInput})`);

  const placeId = extractPlaceId(placeIdInput);

  // Call Google Places API with reviews field - prefer German reviews
  const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=rating,user_ratings_total,name,geometry,reviews&language=de&reviews_sort=newest&key=${googleApiKey}`;

  const response = await fetch(placeDetailsUrl);
  const data: GooglePlaceDetails = await response.json();

  if (data.status !== "OK") {
    console.error(`Google API error for ${partner.name}:`, data.status, data.error_message);
    return {
      partnerId: partner.id,
      name: partner.name,
      success: false,
      error: `Google API: ${data.status} - ${data.error_message || "Unknown error"}`,
    };
  }

  const newRating = data.result?.rating ?? null;
  const newReviewCount = data.result?.user_ratings_total ?? null;
  const googleReviews = data.result?.reviews || [];

  // Update partner rating and count
  const updates = {
    google_place_id: placeId,
    google_rating: newRating,
    google_review_count: newReviewCount,
    updated_at: new Date().toISOString(),
    lat: data.result?.geometry?.location?.lat ?? undefined,
    lng: data.result?.geometry?.location?.lng ?? undefined,
  };

  const { error: updateError } = await supabase
    .from("partners")
    .update(updates)
    .eq("id", partner.id);

  if (updateError) {
    console.error(`Error updating partner ${partner.name}:`, updateError);
    return {
      partnerId: partner.id,
      name: partner.name,
      success: false,
      error: updateError.message,
    };
  }

  // Filter reviews by minimum rating and sync to partner_reviews table
  const filteredReviews = googleReviews.filter((r) => r.rating >= minRating);
  let reviewsSynced = 0;

  for (const review of filteredReviews) {
    // Create a unique identifier for this review (author + time)
    const googleReviewId = `${placeId}_${review.time}_${review.author_name.replace(/\s+/g, '_').substring(0, 20)}`;

    const reviewData = {
      partner_id: partner.id,
      google_review_id: googleReviewId,
      author_name: review.author_name,
      author_photo_url: review.profile_photo_url || null,
      rating: review.rating,
      text: review.text || null,
      relative_time_description: review.relative_time_description,
      review_time: new Date(review.time * 1000).toISOString(),
      language: review.language || 'de',
      is_visible: true,
      synced_at: new Date().toISOString(),
    };

    // Upsert - insert or update if already exists
    const { error: reviewError } = await supabase
      .from("partner_reviews")
      .upsert(reviewData, { 
        onConflict: 'google_review_id',
        ignoreDuplicates: false 
      });

    if (reviewError) {
      console.error(`Error syncing review for ${partner.name}:`, reviewError);
    } else {
      reviewsSynced++;
    }
  }

  console.log(`Updated ${partner.name}: rating=${newRating}, reviews=${newReviewCount}, synced=${reviewsSynced} reviews`);

  return {
    partnerId: partner.id,
    name: partner.name,
    success: true,
    rating: newRating ?? undefined,
    reviewCount: newReviewCount ?? undefined,
    reviewsSynced,
  };
}
