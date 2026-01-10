import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RewardSuggestion {
  title: string;
  description: string;
  reward_type: 'fixed_discount' | 'percent_discount' | 'free_item' | 'experience';
  taler_cost: number;
  value_amount?: number;
  value_percent?: number;
  terms: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partnerName, category, description } = await req.json();

    if (!partnerName || !category) {
      return new Response(
        JSON.stringify({ success: false, error: 'Partner name and category required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating reward suggestions for: ${partnerName} (${category})`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Experte für Kundenbindungsprogramme und Gutschein-Angebote in der Schweiz. 
Du generierst passende Gutschein-Vorschläge für lokale Geschäfte.

Die Gutscheine werden in einer Radio-Treue-App eingelöst. Benutzer sammeln "Taler" durch Radio hören und können diese gegen Gutscheine eintauschen.

Wichtige Richtlinien:
- Vorschläge müssen zum Geschäftstyp passen
- Realistische Werte (nicht zu grosszügig, aber attraktiv)
- Deutsche Sprache (Schweizer Hochdeutsch)
- Konkrete, klare Beschreibungen
- Sinnvolle Taler-Kosten (50-200 für kleine Rabatte, 100-300 für mittlere, 200-500 für grössere)

Reward-Typen:
- fixed_discount: Fester Rabatt in CHF (z.B. "CHF 5 Rabatt")
- percent_discount: Prozent-Rabatt (z.B. "10% Rabatt")
- free_item: Gratis Artikel/Leistung (z.B. "Gratis Dessert")
- experience: Erlebnis (z.B. "VIP-Tour", "Meet & Greet")`
          },
          {
            role: 'user',
            content: `Generiere 3-4 passende Gutschein-Vorschläge für:

Partner: ${partnerName}
Kategorie: ${category}
${description ? `Beschreibung: ${description}` : ''}

Gib die Vorschläge als JSON-Array zurück mit diesem Format:
[
  {
    "title": "Kurzer Titel",
    "description": "Beschreibung was man bekommt",
    "reward_type": "fixed_discount" | "percent_discount" | "free_item" | "experience",
    "taler_cost": 100,
    "value_amount": 5 (nur bei fixed_discount, in CHF),
    "value_percent": 10 (nur bei percent_discount),
    "terms": "Bedingungen (z.B. Mindestbestellwert, Gültigkeit)"
  }
]`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_rewards',
              description: 'Returns reward suggestions for a partner',
              parameters: {
                type: 'object',
                properties: {
                  rewards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        reward_type: { type: 'string', enum: ['fixed_discount', 'percent_discount', 'free_item', 'experience'] },
                        taler_cost: { type: 'number' },
                        value_amount: { type: 'number' },
                        value_percent: { type: 'number' },
                        terms: { type: 'string' }
                      },
                      required: ['title', 'description', 'reward_type', 'taler_cost', 'terms']
                    }
                  }
                },
                required: ['rewards']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_rewards' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit erreicht, bitte später erneut versuchen' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    // Extract rewards from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'suggest_rewards') {
      console.error('Unexpected AI response structure');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rewards: RewardSuggestion[] = JSON.parse(toolCall.function.arguments).rewards;

    console.log(`Generated ${rewards.length} reward suggestions`);

    return new Response(
      JSON.stringify({ success: true, rewards }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating reward suggestions:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
