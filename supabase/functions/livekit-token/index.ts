import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// LiveKit Access Token generation
// Based on LiveKit's JWT format: https://docs.livekit.io/realtime/concepts/authentication/
const generateLiveKitToken = async (
  apiKey: string,
  apiSecret: string,
  roomName: string,
  participantIdentity: string,
  participantName: string
): Promise<string> => {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiry

  const payload = {
    iss: apiKey,
    sub: participantIdentity,
    iat: now,
    exp: exp,
    nbf: now,
    name: participantName,
    video: {
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
    metadata: JSON.stringify({ joinedAt: new Date().toISOString() })
  };

  // Base64URL encode
  const base64UrlEncode = (data: string): string => {
    return btoa(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  // Create HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const messageData = encoder.encode(signatureInput);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureArray = new Uint8Array(signature);
  
  // Convert to base64url
  let binaryString = '';
  for (let i = 0; i < signatureArray.length; i++) {
    binaryString += String.fromCharCode(signatureArray[i]);
  }
  const encodedSignature = btoa(binaryString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[livekit-token] Request received');

    // Get auth token from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('[livekit-token] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[livekit-token] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[livekit-token] User authenticated:', user.id);

    // Parse request body
    const { roomName, songIdentifier } = await req.json();
    
    if (!roomName) {
      return new Response(
        JSON.stringify({ error: 'roomName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, first_name, leaderboard_nickname')
      .eq('id', user.id)
      .single();

    const displayName = profile?.display_name || 
                        profile?.leaderboard_nickname || 
                        profile?.first_name || 
                        'Dancer';

    // Get LiveKit credentials
    const livekitUrl = Deno.env.get('LIVEKIT_URL');
    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

    if (!livekitUrl || !apiKey || !apiSecret) {
      console.error('[livekit-token] Missing LiveKit credentials');
      return new Response(
        JSON.stringify({ error: 'LiveKit not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[livekit-token] Generating token for room:', roomName, 'user:', displayName);

    // Generate access token
    const accessToken = await generateLiveKitToken(
      apiKey,
      apiSecret,
      roomName,
      user.id,
      displayName
    );

    console.log('[livekit-token] Token generated successfully');

    return new Response(
      JSON.stringify({ 
        token: accessToken,
        url: livekitUrl,
        roomName,
        participantName: displayName
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[livekit-token] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
