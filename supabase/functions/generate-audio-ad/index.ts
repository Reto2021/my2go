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

// Helper: Fetch audio from URL as ArrayBuffer
async function fetchAudioBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${url}`);
  }
  return response.arrayBuffer();
}

// Helper: Concatenate multiple audio buffers
function concatenateAudioBuffers(...buffers: ArrayBuffer[]): Uint8Array {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  
  return result;
}

// Helper: Estimate duration from buffer size (rough: 16KB/s for 128kbps MP3)
function estimateDurationFromBytes(bytes: number): number {
  return Math.ceil(bytes / 16000);
}

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

    // Action: generate - Generate and save full audio ad (with optional jingle)
    if (action === 'generate') {
      if (!audioAdId) {
        throw new Error('Missing audioAdId');
      }

      // Get the audio ad details with jingle
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
      console.log(`Jingle attached: ${audioAd.audio_jingles?.name || 'None'}`);
      console.log(`Using uploaded claim: ${audioAd.uploaded_claim_url ? 'Yes' : 'No (TTS)'}`);

      // Prepare audio segments
      const audioSegments: ArrayBuffer[] = [];
      let totalDurationEstimate = 0;

      // Add intro jingle if available
      if (audioAd.audio_jingles?.intro_url) {
        try {
          console.log(`Fetching intro jingle: ${audioAd.audio_jingles.intro_url}`);
          const introBuffer = await fetchAudioBuffer(audioAd.audio_jingles.intro_url);
          audioSegments.push(introBuffer);
          totalDurationEstimate += estimateDurationFromBytes(introBuffer.byteLength);
          console.log(`Intro jingle added: ${introBuffer.byteLength} bytes`);
        } catch (e) {
          console.error('Failed to fetch intro jingle:', e);
        }
      }

      // Get claim audio - either from uploaded file or generate TTS
      let claimBuffer: ArrayBuffer;

      if (audioAd.uploaded_claim_url) {
        // Use uploaded audio file
        console.log(`Using uploaded claim audio: ${audioAd.uploaded_claim_url}`);
        claimBuffer = await fetchAudioBuffer(audioAd.uploaded_claim_url);
        totalDurationEstimate += estimateDurationFromBytes(claimBuffer.byteLength);
        console.log(`Uploaded claim audio: ${claimBuffer.byteLength} bytes`);
      } else {
        // Generate TTS for the claim text
        console.log(`Generating TTS for claim: ${audioAd.claim_text.substring(0, 50)}...`);
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

        claimBuffer = await ttsResponse.arrayBuffer();
        // Estimate TTS duration: ~150 words per minute for German
        const wordCount = audioAd.claim_text.split(/\s+/).length;
        totalDurationEstimate += Math.ceil((wordCount / 150) * 60);
        console.log(`TTS generated: ${claimBuffer.byteLength} bytes`);
      }

      audioSegments.push(claimBuffer);

      // Add outro jingle if available
      if (audioAd.audio_jingles?.outro_url) {
        try {
          console.log(`Fetching outro jingle: ${audioAd.audio_jingles.outro_url}`);
          const outroBuffer = await fetchAudioBuffer(audioAd.audio_jingles.outro_url);
          audioSegments.push(outroBuffer);
          totalDurationEstimate += estimateDurationFromBytes(outroBuffer.byteLength);
          console.log(`Outro jingle added: ${outroBuffer.byteLength} bytes`);
        } catch (e) {
          console.error('Failed to fetch outro jingle:', e);
        }
      }

      // Concatenate all audio segments
      const finalAudio = concatenateAudioBuffers(...audioSegments);
      console.log(`Final audio: ${finalAudio.byteLength} bytes, ~${totalDurationEstimate}s`);

      // Upload to storage
      const fileName = `${audioAdId}/${Date.now()}.mp3`;
      
      const { error: uploadError } = await supabase.storage
        .from('audio-ads')
        .upload(fileName, finalAudio, {
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

      // Update audio ad with URL and status
      const { error: updateError } = await supabase
        .from('audio_ads')
        .update({
          generated_audio_url: urlData.publicUrl,
          generation_status: 'completed',
          generation_error: null,
          duration_seconds: totalDurationEstimate,
        })
        .eq('id', audioAdId);

      if (updateError) {
        throw new Error(`Failed to update audio ad: ${updateError.message}`);
      }

      console.log(`Audio ad generated successfully: ${urlData.publicUrl}`);

      return new Response(JSON.stringify({ 
        success: true, 
        audioUrl: urlData.publicUrl,
        duration: totalDurationEstimate,
        hasJingle: !!audioAd.audio_jingles,
        usedUploadedClaim: !!audioAd.uploaded_claim_url,
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
