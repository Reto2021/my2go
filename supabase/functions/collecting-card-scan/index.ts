import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { partner_id, campaign_slug } = await req.json();

    if (!partner_id || !campaign_slug) {
      return new Response(JSON.stringify({ error: "Missing partner_id or campaign_slug" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get campaign
    const { data: campaign, error: campErr } = await supabase
      .from("collecting_campaigns")
      .select("*")
      .eq("slug", campaign_slug)
      .eq("is_active", true)
      .single();

    if (campErr || !campaign) {
      return new Response(JSON.stringify({ error: "Kampagne nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check campaign time window
    const now = new Date();
    if (campaign.starts_at && new Date(campaign.starts_at) > now) {
      return new Response(JSON.stringify({ error: "Kampagne hat noch nicht begonnen" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (campaign.ends_at && new Date(campaign.ends_at) < now) {
      return new Response(JSON.stringify({ error: "Kampagne ist beendet" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify partner exists
    const { data: partner } = await supabase
      .from("partners")
      .select("id, name")
      .eq("id", partner_id)
      .eq("is_active", true)
      .single();

    if (!partner) {
      return new Response(JSON.stringify({ error: "Partner nicht gefunden" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get or create card
    let { data: card } = await supabase
      .from("collecting_cards")
      .select("*")
      .eq("user_id", user.id)
      .eq("campaign_id", campaign.id)
      .single();

    if (!card) {
      const { data: newCard, error: createErr } = await supabase
        .from("collecting_cards")
        .insert({ user_id: user.id, campaign_id: campaign.id })
        .select()
        .single();
      if (createErr) {
        return new Response(JSON.stringify({ error: "Karte konnte nicht erstellt werden" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      card = newCard;
    }

    // Check if already completed
    if (card.is_completed) {
      return new Response(JSON.stringify({ 
        error: "Karte bereits abgeschlossen",
        card,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Get existing cells for this card
    const { data: existingCells } = await supabase
      .from("collecting_card_cells")
      .select("*")
      .eq("card_id", card.id)
      .order("scanned_at", { ascending: true });

    const cells = existingCells || [];

    // FRAUD CHECK 1: Cooldown — last scan at this shop < scan_cooldown_hours
    const lastScanAtShop = cells
      .filter((c) => c.partner_id === partner_id)
      .sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime())[0];

    if (lastScanAtShop) {
      const hoursSince = (now.getTime() - new Date(lastScanAtShop.scanned_at).getTime()) / (1000 * 60 * 60);
      if (hoursSince < campaign.scan_cooldown_hours) {
        const remainingHours = Math.ceil(campaign.scan_cooldown_hours - hoursSince);
        return new Response(JSON.stringify({ 
          error: `Komm in ${remainingHours}h wieder zu ${partner.name}`,
          fraud_check: "cooldown",
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // FRAUD CHECK 2: Daily limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const scansToday = cells.filter(
      (c) => new Date(c.scanned_at) >= todayStart
    ).length;

    if (scansToday >= campaign.max_scans_per_day) {
      return new Response(JSON.stringify({ 
        error: `Heute bereits ${campaign.max_scans_per_day} Scans gemacht. Morgen geht's weiter!`,
        fraud_check: "daily_limit",
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine move type
    const uniqueShopIds = new Set(cells.map((c) => c.partner_id));
    const isNewShop = !uniqueShopIds.has(partner_id);
    const moveType = isNewShop ? "vertical" : "horizontal";

    const newPosition = card.current_position + 1;

    // Check sponsored cell at this position
    const { data: sponsoredCell } = await supabase
      .from("collecting_sponsored_cells")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("cell_position", newPosition)
      .eq("is_active", true)
      .single();

    // Insert the cell
    const { data: newCell, error: cellErr } = await supabase
      .from("collecting_card_cells")
      .insert({
        card_id: card.id,
        cell_position: newPosition,
        partner_id,
        move_type: moveType,
        sponsored_cell_id: sponsoredCell?.id || null,
      })
      .select()
      .single();

    if (cellErr) {
      return new Response(JSON.stringify({ error: "Scan konnte nicht gespeichert werden" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update card position
    const newTotalPurchases = card.total_purchases + 1;
    const updateData: Record<string, unknown> = {
      current_position: newPosition,
      total_purchases: newTotalPurchases,
    };

    // Check if goal reached
    let isCompleted = false;
    let completionBlocked = false;
    let completionBlockReason = "";

    if (newTotalPurchases >= campaign.required_purchases) {
      // FRAUD CHECK 3: Unique shops minimum
      const finalUniqueShops = new Set([...uniqueShopIds, partner_id]).size;
      if (finalUniqueShops < campaign.min_unique_shops) {
        completionBlocked = true;
        completionBlockReason = `Noch ${campaign.min_unique_shops - finalUniqueShops} verschiedene Shops nötig`;
      }

      // FRAUD CHECK 4: Minimum days
      const daysSinceStart = (now.getTime() - new Date(card.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceStart < campaign.min_days_to_complete) {
        completionBlocked = true;
        completionBlockReason = `Mindestens ${campaign.min_days_to_complete} Tage nötig`;
      }

      if (!completionBlocked) {
        isCompleted = true;
        updateData.is_completed = true;
        updateData.completed_at = now.toISOString();
      }
    }

    await supabase
      .from("collecting_cards")
      .update(updateData)
      .eq("id", card.id);

    // Award sponsored cell bonus
    let sponsoredBonus = null;
    if (sponsoredCell && sponsoredCell.bonus_type === "extra_taler" && sponsoredCell.bonus_value) {
      // Award taler
      await supabase.rpc("add_taler_to_batch", {
        p_user_id: user.id,
        p_amount: sponsoredCell.bonus_value,
      });
      await supabase.from("transactions").insert({
        user_id: user.id,
        amount: sponsoredCell.bonus_value,
        type: "earn",
        source: "collecting_card",
        description: `Bonusfeld: ${sponsoredCell.display_text || "Bonus"}`,
      });
      // Mark bonus claimed
      await supabase
        .from("collecting_card_cells")
        .update({ bonus_claimed: true })
        .eq("id", newCell.id);
      
      sponsoredBonus = {
        type: sponsoredCell.bonus_type,
        value: sponsoredCell.bonus_value,
        text: sponsoredCell.display_text,
      };
    }

    // Check milestones
    let milestoneReward = null;
    const milestones = (campaign.milestones as Array<{ at_purchase: number; type: string; value: number; label?: string }>) || [];
    const hitMilestone = milestones.find((m) => m.at_purchase === newTotalPurchases);
    if (hitMilestone && hitMilestone.type === "bonus_taler") {
      await supabase.rpc("add_taler_to_batch", {
        p_user_id: user.id,
        p_amount: hitMilestone.value,
      });
      await supabase.from("transactions").insert({
        user_id: user.id,
        amount: hitMilestone.value,
        type: "earn",
        source: "collecting_card",
        description: `Meilenstein: ${hitMilestone.label || `${hitMilestone.at_purchase}. Einkauf`}`,
      });
      milestoneReward = hitMilestone;
    }

    // Award completion prize
    let completionReward = null;
    if (isCompleted && campaign.prize_taler && campaign.prize_taler > 0) {
      await supabase.rpc("add_taler_to_batch", {
        p_user_id: user.id,
        p_amount: campaign.prize_taler,
      });
      await supabase.from("transactions").insert({
        user_id: user.id,
        amount: campaign.prize_taler,
        type: "earn",
        source: "collecting_card",
        description: `Sammelkarte abgeschlossen: ${campaign.title}`,
      });
      completionReward = { taler: campaign.prize_taler, description: campaign.prize_description };
    }

    return new Response(JSON.stringify({
      success: true,
      card: {
        ...card,
        current_position: newPosition,
        total_purchases: newTotalPurchases,
        is_completed: isCompleted,
      },
      cell: newCell,
      move_type: moveType,
      is_new_shop: isNewShop,
      partner_name: partner.name,
      sponsored_bonus: sponsoredBonus,
      milestone_reward: milestoneReward,
      completion_reward: completionReward,
      completion_blocked: completionBlocked ? completionBlockReason : null,
      unique_shops: new Set([...uniqueShopIds, partner_id]).size,
      required_purchases: campaign.required_purchases,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("collecting-card-scan error:", error);
    return new Response(JSON.stringify({ error: "Interner Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
