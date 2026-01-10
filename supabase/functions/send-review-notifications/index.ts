import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Web Push - simplified implementation
async function sendWebPush(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}, payload: string): Promise<boolean> {
  try {
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
    console.log('Starting review notification check...')

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

    // Find redemptions that:
    // 1. Are "used" status
    // 2. Were redeemed in the last 24 hours
    // 3. Partner has review_request_enabled
    // 4. Enough time has passed since redemption (review_request_delay_minutes)
    // 5. No review_request exists yet for this redemption

    const oneDayAgo = new Date()
    oneDayAgo.setHours(oneDayAgo.getHours() - 24)

    const { data: redemptions, error: redemptionsError } = await supabase
      .from('redemptions')
      .select(`
        id,
        user_id,
        partner_id,
        redeemed_at,
        partners:partner_id (
          name,
          review_request_enabled,
          review_request_delay_minutes
        )
      `)
      .eq('status', 'used')
      .gte('redeemed_at', oneDayAgo.toISOString())

    if (redemptionsError) {
      console.error('Error fetching redemptions:', redemptionsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch redemptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${redemptions?.length || 0} recent redemptions to check`)

    if (!redemptions || redemptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No redemptions to check', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter for eligible redemptions
    const now = new Date()
    const eligibleRedemptions = []

    for (const redemption of redemptions) {
      const partner = redemption.partners as any
      if (!partner?.review_request_enabled) continue

      // Check if enough time has passed
      const delayMinutes = partner.review_request_delay_minutes || 5
      const redeemedAt = new Date(redemption.redeemed_at!)
      const minutesSinceRedemption = (now.getTime() - redeemedAt.getTime()) / (1000 * 60)

      if (minutesSinceRedemption < delayMinutes) continue

      // Check if review request already exists
      const { data: existingRequest } = await supabase
        .from('review_requests')
        .select('id')
        .eq('redemption_id', redemption.id)
        .maybeSingle()

      if (existingRequest) continue

      eligibleRedemptions.push({
        ...redemption,
        partnerName: partner.name,
      })
    }

    console.log(`${eligibleRedemptions.length} redemptions eligible for review notification`)

    let sentCount = 0
    let errorCount = 0
    let createdRequests = 0

    for (const redemption of eligibleRedemptions) {
      // Get user's push subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', redemption.user_id)
        .eq('is_active', true)

      if (subError || !subscriptions || subscriptions.length === 0) {
        console.log(`No active push subscriptions for user ${redemption.user_id}`)
        continue
      }

      // Create review_request record to prevent duplicate notifications
      const { error: insertError } = await supabase
        .from('review_requests')
        .insert({
          user_id: redemption.user_id,
          partner_id: redemption.partner_id,
          redemption_id: redemption.id,
        })

      if (insertError) {
        console.error(`Error creating review request for redemption ${redemption.id}:`, insertError)
        continue
      }

      createdRequests++

      // Create notification payload
      const payload = JSON.stringify({
        title: '⭐ Wie war dein Besuch?',
        body: `Bewerte deinen Besuch bei ${redemption.partnerName} und erhalte 5 Bonus-Taler!`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: {
          url: '/',
          type: 'review-request',
          redemptionId: redemption.id,
          partnerId: redemption.partner_id,
        },
        tag: `review-${redemption.id}`,
        requireInteraction: true,
      })

      // Send to all user's subscriptions
      for (const sub of subscriptions) {
        try {
          const success = await sendWebPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload
          )
          
          if (success) {
            sentCount++
            console.log(`Review notification sent to user ${redemption.user_id} for partner ${redemption.partnerName}`)
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

    console.log(`Review notification sending complete. Sent: ${sentCount}, Errors: ${errorCount}, Created requests: ${createdRequests}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${sentCount} review notifications`,
        sent: sentCount,
        errors: errorCount,
        createdRequests,
        eligibleRedemptions: eligibleRedemptions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send review notifications error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
