import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token)
    
    if (claimsError || !claimsData?.user) {
      console.error('Auth error:', claimsError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.user.id
    const { action, subscription } = await req.json() as { 
      action: 'subscribe' | 'unsubscribe';
      subscription: PushSubscription;
    }

    console.log(`Push ${action} request for user ${userId}`)

    if (action === 'subscribe') {
      // Upsert the subscription
      const { error: upsertError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint'
        })

      if (upsertError) {
        console.error('Error saving subscription:', upsertError)
        return new Response(
          JSON.stringify({ error: 'Failed to save subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Push subscription saved successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Subscription saved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (action === 'unsubscribe') {
      // Deactivate the subscription
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint)

      if (deleteError) {
        console.error('Error removing subscription:', deleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to remove subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Push subscription removed successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Subscription removed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Push subscribe error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
