import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// EQ presets: 5-band parametric EQ (low, low-mid, mid, high-mid, high) + compressor settings
const EQ_PRESETS: Record<string, { label: string; bands: number[]; compressor: { threshold: number; ratio: number; attack: number; release: number }; description: string }> = {
  pop: {
    label: "Pop",
    bands: [2, 1, -1, 2, 3], // slight bass boost, treble sparkle
    compressor: { threshold: -18, ratio: 3, attack: 0.01, release: 0.15 },
    description: "Klarer Gesang, präsente Höhen",
  },
  rock: {
    label: "Rock",
    bands: [4, 2, 1, 3, 2], // strong low-end, mid presence
    compressor: { threshold: -15, ratio: 4, attack: 0.005, release: 0.1 },
    description: "Druckvoller Sound, Gitarren-Punch",
  },
  hiphop: {
    label: "Hip-Hop",
    bands: [5, 3, -1, 1, 2], // heavy bass, sub emphasis
    compressor: { threshold: -16, ratio: 4, attack: 0.003, release: 0.12 },
    description: "Tiefer Bass, klare Vocals",
  },
  electronic: {
    label: "Electronic",
    bands: [4, 2, 0, 2, 4], // sub bass + crisp highs
    compressor: { threshold: -14, ratio: 3.5, attack: 0.002, release: 0.08 },
    description: "Synth-Klarheit, breites Stereo",
  },
  jazz: {
    label: "Jazz",
    bands: [1, 0, 1, 2, 1], // warm, natural
    compressor: { threshold: -22, ratio: 2, attack: 0.02, release: 0.25 },
    description: "Warm, natürlich, dynamisch",
  },
  classical: {
    label: "Klassik",
    bands: [0, 0, 0, 1, 1], // minimal processing, slight air
    compressor: { threshold: -24, ratio: 1.5, attack: 0.03, release: 0.3 },
    description: "Transparent, volle Dynamik",
  },
  rnb: {
    label: "R&B / Soul",
    bands: [3, 2, 0, 2, 2], // warm bass, smooth mids
    compressor: { threshold: -18, ratio: 3, attack: 0.01, release: 0.2 },
    description: "Samtiger Bass, glatte Vocals",
  },
  metal: {
    label: "Metal",
    bands: [4, 1, 3, 4, 3], // scooped mids, aggressive
    compressor: { threshold: -12, ratio: 5, attack: 0.002, release: 0.08 },
    description: "Aggressiv, maximaler Druck",
  },
  acoustic: {
    label: "Akustik",
    bands: [1, 1, 2, 2, 1], // natural presence
    compressor: { threshold: -20, ratio: 2, attack: 0.02, release: 0.25 },
    description: "Natürlich, Detail-reich",
  },
  flat: {
    label: "Neutral",
    bands: [0, 0, 0, 0, 0],
    compressor: { threshold: -24, ratio: 1.5, attack: 0.03, release: 0.3 },
    description: "Keine Bearbeitung",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, artist } = await req.json();
    if (!title || !artist) {
      return new Response(JSON.stringify({ preset: "flat", ...EQ_PRESETS.flat }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback to pop if no API key
      return new Response(JSON.stringify({ preset: "pop", ...EQ_PRESETS.pop }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validPresets = Object.keys(EQ_PRESETS).filter(k => k !== "flat");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You classify songs into audio EQ presets. Given a song title and artist, respond with ONLY one word from this list: ${validPresets.join(", ")}. Nothing else. If unsure, respond "pop".`,
          },
          {
            role: "user",
            content: `Song: "${title}" by ${artist}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Fallback
      return new Response(JSON.stringify({ preset: "pop", ...EQ_PRESETS.pop }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawResponse = data.choices?.[0]?.message?.content?.trim().toLowerCase() || "pop";
    const preset = validPresets.includes(rawResponse) ? rawResponse : "pop";

    return new Response(
      JSON.stringify({ preset, ...EQ_PRESETS[preset] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("classify-song error:", e);
    return new Response(
      JSON.stringify({ preset: "pop", ...EQ_PRESETS.pop }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
