import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Web Push library for Deno
async function sendWebPush(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}, payload: string, vapidPublicKey: string, vapidPrivateKey: string): Promise<boolean> {
  try {
    // For web push, we need to use the web-push protocol
    // This is a simplified implementation - in production, use a proper library
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
      },
      body: payload,
    })
    
    return response.ok || response.status === 201
  } catch (error) {
    console.error('Error sending push notification:', error)
    return false
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting expiry notification check...')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured')
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find redemptions expiring in the next 24 hours that are still pending
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const { data: expiringRedemptions, error: redemptionsError } = await supabase
      .from('redemptions')
      .select(`
        id,
        user_id,
        expires_at,
        redemption_code,
        reward:rewards(title),
        partner:partners(name)
      `)
      .eq('status', 'pending')
      .gte('expires_at', now.toISOString())
      .lte('expires_at', in24Hours.toISOString())

    if (redemptionsError) {
      console.error('Error fetching expiring redemptions:', redemptionsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch redemptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${expiringRedemptions?.length || 0} expiring redemptions`)

    if (!expiringRedemptions || expiringRedemptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No expiring redemptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Group by user_id to avoid sending multiple notifications
    const userRedemptions = new Map<string, typeof expiringRedemptions>()
    for (const redemption of expiringRedemptions) {
      const existing = userRedemptions.get(redemption.user_id) || []
      existing.push(redemption)
      userRedemptions.set(redemption.user_id, existing)
    }

    let sentCount = 0
    let errorCount = 0

    // Send notifications for each user
    for (const [userId, redemptions] of userRedemptions) {
      // Get user's push subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (subError || !subscriptions || subscriptions.length === 0) {
        console.log(`No active push subscriptions for user ${userId}`)
        continue
      }

      // Create notification payload
      const count = redemptions.length
      const firstRedemption = redemptions[0]
      const rewardTitle = (firstRedemption.reward as any)?.title || 'Gutschein'
      const partnerName = (firstRedemption.partner as any)?.name || ''

      const payload = JSON.stringify({
        title: count === 1 
          ? '⏰ Gutschein läuft bald ab!' 
          : `⏰ ${count} Gutscheine laufen bald ab!`,
        body: count === 1
          ? `Dein Gutschein "${rewardTitle}" bei ${partnerName} läuft in weniger als 24 Stunden ab!`
          : `Du hast ${count} Gutscheine, die in weniger als 24 Stunden ablaufen. Löse sie jetzt ein!`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: {
          url: '/my-redemptions',
          redemptionIds: redemptions.map(r => r.id),
        },
        tag: 'expiry-notification',
        requireInteraction: true,
      })

      // Send to all user's subscriptions
      for (const sub of subscriptions) {
        try {
          const success = await sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload,
            vapidPublicKey,
            vapidPrivateKey
          )
          
          if (success) {
            sentCount++
            console.log(`Notification sent to user ${userId}`)
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

    console.log(`Notification sending complete. Sent: ${sentCount}, Errors: ${errorCount}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${sentCount} notifications`,
        sent: sentCount,
        errors: errorCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send expiry notifications error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
