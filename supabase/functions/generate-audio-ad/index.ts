import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Swiss German voices from ElevenLabs
const SWISS_VOICES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Male)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Female)' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Male)' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily (Female)' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam (Male)' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, audioAdId, text, voiceId } = await req.json();

    // Action: list-voices - Return available Swiss German voices
    if (action === 'list-voices') {
      return new Response(JSON.stringify({ voices: SWISS_VOICES }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: preview - Generate preview TTS without saving
    if (action === 'preview') {
      if (!text || !voiceId) {
        throw new Error('Missing text or voiceId for preview');
      }

      const ttsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.3,
            },
          }),
        }
      );

      if (!ttsResponse.ok) {
        const error = await ttsResponse.text();
        throw new Error(`ElevenLabs API error: ${error}`);
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      
      return new Response(audioBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'audio/mpeg',
        },
      });
    }

    // Action: generate - Generate and save full audio ad
    if (action === 'generate') {
      if (!audioAdId) {
        throw new Error('Missing audioAdId');
      }

      // Get the audio ad details
      const { data: audioAd, error: adError } = await supabase
        .from('audio_ads')
        .select('*, audio_jingles(*)')
        .eq('id', audioAdId)
        .single();

      if (adError || !audioAd) {
        throw new Error(`Audio ad not found: ${adError?.message}`);
      }

      // Update status to generating
      await supabase
        .from('audio_ads')
        .update({ generation_status: 'generating' })
        .eq('id', audioAdId);

      console.log(`Generating audio for ad: ${audioAd.title}`);

      // Generate TTS for the claim text
      const ttsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${audioAd.voice_id}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: audioAd.claim_text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.3,
            },
          }),
        }
      );

      if (!ttsResponse.ok) {
        const error = await ttsResponse.text();
        await supabase
          .from('audio_ads')
          .update({ 
            generation_status: 'failed',
            generation_error: error 
          })
          .eq('id', audioAdId);
        throw new Error(`ElevenLabs API error: ${error}`);
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      const audioBytes = new Uint8Array(audioBuffer);

      // For now, save just the TTS audio
      // TODO: In Phase 2, stitch with jingle intro/outro
      const fileName = `${audioAdId}/${Date.now()}.mp3`;
      
      const { error: uploadError } = await supabase.storage
        .from('audio-ads')
        .upload(fileName, audioBytes, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (uploadError) {
        await supabase
          .from('audio_ads')
          .update({ 
            generation_status: 'failed',
            generation_error: uploadError.message 
          })
          .eq('id', audioAdId);
        throw new Error(`Storage upload error: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio-ads')
        .getPublicUrl(fileName);

      // Estimate duration (rough: ~150 words per minute for German)
      const wordCount = audioAd.claim_text.split(/\s+/).length;
      const estimatedDuration = Math.ceil((wordCount / 150) * 60);

      // Update audio ad with URL and status
      const { error: updateError } = await supabase
        .from('audio_ads')
        .update({
          generated_audio_url: urlData.publicUrl,
          generation_status: 'completed',
          generation_error: null,
          duration_seconds: estimatedDuration,
        })
        .eq('id', audioAdId);

      if (updateError) {
        throw new Error(`Failed to update audio ad: ${updateError.message}`);
      }

      console.log(`Audio ad generated successfully: ${urlData.publicUrl}`);

      return new Response(JSON.stringify({ 
        success: true, 
        audioUrl: urlData.publicUrl,
        duration: estimatedDuration,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
