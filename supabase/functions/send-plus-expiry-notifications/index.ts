import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting Plus expiry notification check...')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find users with subscriptions expiring in the next 3-5 days
    const now = new Date()
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)

    const { data: expiringProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, first_name, subscription_status, subscription_tier, subscription_ends_at')
      .eq('subscription_status', 'active')
      .gte('subscription_ends_at', in3Days.toISOString())
      .lte('subscription_ends_at', in5Days.toISOString())

    if (profilesError) {
      console.error('Error fetching expiring profiles:', profilesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${expiringProfiles?.length || 0} profiles with expiring Plus subscriptions`)

    if (!expiringProfiles || expiringProfiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No expiring Plus subscriptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let sentCount = 0
    let errorCount = 0

    // Send notifications for each user
    for (const profile of expiringProfiles) {
      // Get user's push subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true)

      if (subError || !subscriptions || subscriptions.length === 0) {
        console.log(`No active push subscriptions for user ${profile.id}`)
        continue
      }

      // Calculate days remaining
      const expiryDate = new Date(profile.subscription_ends_at!)
      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      
      const userName = profile.first_name || profile.display_name || 'Du'
      const tierName = profile.subscription_tier === 'taler' ? 'Taler-Plus' : '2Go Plus'

      const payload = JSON.stringify({
        title: `⏰ ${tierName} läuft bald ab!`,
        body: `Hey ${userName}, dein ${tierName} Abo läuft in ${daysRemaining} Tagen ab. Verlängere jetzt, um weiterhin Premium-Vorteile zu geniessen!`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: {
          url: '/settings',
          type: 'plus-expiry',
          userId: profile.id,
        },
        tag: 'plus-expiry-notification',
        requireInteraction: true,
      })

      // Send to all user's subscriptions
      for (const sub of subscriptions) {
        try {
          const response = await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400',
            },
            body: payload,
          })
          
          if (response.ok || response.status === 201) {
            sentCount++
            console.log(`Plus expiry notification sent to user ${profile.id}`)
          } else {
            errorCount++
            // Deactivate failed subscription
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', sub.id)
          }
        } catch (err) {
          console.error(`Error sending to subscription ${sub.id}:`, err)
          errorCount++
        }
      }
    }

    console.log(`Plus expiry notification sending complete. Sent: ${sentCount}, Errors: ${errorCount}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${sentCount} Plus expiry notifications`,
        sent: sentCount,
        errors: errorCount,
        profilesChecked: expiringProfiles.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send Plus expiry notifications error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
