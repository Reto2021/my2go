import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WalletPassRequest {
  userId: string;
  walletType: 'apple' | 'google';
}

interface UserData {
  displayName: string;
  balance: number;
  memberCode: string;
  memberId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { walletType } = await req.json() as WalletPassRequest;

    // Fetch user data
    const [profileResult, balanceResult, codeResult] = await Promise.all([
      supabase.from("profiles").select("display_name, first_name, last_name").eq("id", user.id).single(),
      supabase.rpc("get_user_balance", { _user_id: user.id }),
      supabase.from("user_codes").select("permanent_code").eq("user_id", user.id).single(),
    ]);

    const displayName = profileResult.data?.display_name || 
      `${profileResult.data?.first_name || ''} ${profileResult.data?.last_name || ''}`.trim() || 
      'My2Go Mitglied';
    
    const balance = balanceResult.data?.[0]?.taler_balance || 0;
    const memberCode = codeResult.data?.permanent_code || user.id.substring(0, 8).toUpperCase();
    const memberId = user.id;

    // Check if pass already exists
    const { data: existingPass } = await supabase
      .from("wallet_passes")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletType === 'google') {
      // Google Wallet Pass Generation
      const googlePassData = await generateGoogleWalletPass({
        displayName,
        balance,
        memberCode,
        memberId,
      });

      // Update or insert wallet pass record
      if (existingPass) {
        await supabase
          .from("wallet_passes")
          .update({
            google_pass_object_id: googlePassData.objectId,
            pass_url: googlePassData.saveUrl,
            last_synced_balance: balance,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        await supabase.from("wallet_passes").insert({
          user_id: user.id,
          google_pass_object_id: googlePassData.objectId,
          pass_url: googlePassData.saveUrl,
          last_synced_balance: balance,
        });
      }

      return new Response(JSON.stringify({
        success: true,
        walletType: 'google',
        saveUrl: googlePassData.saveUrl,
        objectId: googlePassData.objectId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Apple Wallet Pass Generation
      const applePassData = await generateAppleWalletPass({
        displayName,
        balance,
        memberCode,
        memberId,
      });

      // Generate auth token for pass updates
      const authToken = crypto.randomUUID();

      // Update or insert wallet pass record
      if (existingPass) {
        await supabase
          .from("wallet_passes")
          .update({
            apple_pass_serial: applePassData.serialNumber,
            apple_pass_auth_token: authToken,
            pass_url: applePassData.downloadUrl,
            last_synced_balance: balance,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        await supabase.from("wallet_passes").insert({
          user_id: user.id,
          apple_pass_serial: applePassData.serialNumber,
          apple_pass_auth_token: authToken,
          pass_url: applePassData.downloadUrl,
          last_synced_balance: balance,
        });
      }

      return new Response(JSON.stringify({
        success: true,
        walletType: 'apple',
        downloadUrl: applePassData.downloadUrl,
        serialNumber: applePassData.serialNumber,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    const error = err as Error;
    console.error("Error generating wallet pass:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to generate wallet pass",
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateGoogleWalletPass(userData: UserData) {
  // Google Wallet Pass Object
  // Note: Full implementation requires Google Wallet API credentials
  // This creates a pass object that can be added via Google Wallet API
  
  const issuerId = Deno.env.get("GOOGLE_WALLET_ISSUER_ID");
  const classId = `${issuerId}.my2go_membership`;
  const objectId = `${issuerId}.${userData.memberId}`;
  
  // Pass object structure for Google Wallet
  const passObject = {
    id: objectId,
    classId: classId,
    state: "ACTIVE",
    heroImage: {
      sourceUri: {
        uri: "https://my2go.app/images/wallet-hero.png",
      },
    },
    textModulesData: [
      {
        header: "2Go Taler",
        body: userData.balance.toString(),
        id: "balance",
      },
    ],
    linksModuleData: {
      uris: [
        {
          uri: "https://my2go.app",
          description: "My2Go öffnen",
        },
      ],
    },
    barcode: {
      type: "QR_CODE",
      value: userData.memberCode,
      alternateText: userData.memberCode,
    },
    accountId: userData.memberId,
    accountName: userData.displayName,
    loyaltyPoints: {
      label: "2Go Taler",
      balance: {
        int: userData.balance,
      },
    },
  };

  // Generate JWT for save URL
  // In production, this would be signed with Google service account credentials
  const payload = {
    iss: issuerId,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    payload: {
      loyaltyObjects: [passObject],
    },
  };
  
  // Base64 encode the payload for the save URL
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const base64Payload = btoa(String.fromCharCode(...payloadBytes));
  
  const saveUrl = `https://pay.google.com/gp/v/save/${base64Payload}`;

  return {
    objectId,
    passObject,
    // Fallback: Deep link to the app if no Google Wallet credentials
    saveUrl: issuerId 
      ? saveUrl 
      : `https://my2go.app/code?wallet=google&member=${userData.memberCode}`,
  };
}

async function generateAppleWalletPass(userData: UserData) {
  // Apple Wallet Pass Structure
  // Note: Full implementation requires Apple Developer certificates
  // This creates the pass.json structure
  
  const serialNumber = `my2go-${userData.memberId}`;
  
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: "pass.app.my2go.membership",
    serialNumber: serialNumber,
    teamIdentifier: Deno.env.get("APPLE_TEAM_ID") || "TEAM_ID",
    organizationName: "My2Go",
    description: "My2Go Mitgliedskarte",
    logoText: "My2Go",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(234, 88, 12)",
    labelColor: "rgb(255, 255, 255)",
    
    // Barcode
    barcode: {
      format: "PKBarcodeFormatQR",
      message: userData.memberCode,
      messageEncoding: "iso-8859-1",
      altText: userData.memberCode,
    },
    
    // Generic pass type for membership
    generic: {
      primaryFields: [
        {
          key: "balance",
          label: "2Go Taler",
          value: userData.balance,
        },
      ],
      secondaryFields: [
        {
          key: "member",
          label: "Mitglied",
          value: userData.displayName,
        },
      ],
      auxiliaryFields: [
        {
          key: "code",
          label: "Mitgliedscode",
          value: userData.memberCode,
        },
      ],
      backFields: [
        {
          key: "website",
          label: "Website",
          value: "https://my2go.app",
        },
        {
          key: "support",
          label: "Support",
          value: "support@my2go.app",
        },
      ],
    },
    
    // Web service for pass updates
    webServiceURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/wallet-pass-update`,
    authenticationToken: crypto.randomUUID(),
  };

  // In production: Sign the pass with Apple certificates and return .pkpass file
  // For now, return a deep link fallback
  const hasAppleCerts = !!Deno.env.get("APPLE_PASS_CERTIFICATE");
  
  return {
    serialNumber,
    passJson,
    // Fallback if no Apple certificates configured
    downloadUrl: hasAppleCerts
      ? `${Deno.env.get("SUPABASE_URL")}/functions/v1/download-apple-pass?serial=${serialNumber}`
      : `https://my2go.app/code?wallet=apple&member=${userData.memberCode}`,
  };
}
