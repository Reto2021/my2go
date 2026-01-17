import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : ''
  console.log(`[NOTIFY-NEW-PARTNER] ${step}${detailsStr}`)
}

// Send push notification
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

// Calculate distance between two points in km (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logStep('Function started')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { partnerId } = await req.json()

    if (!partnerId) {
      throw new Error('Partner ID required')
    }

    logStep('Processing partner', { partnerId })

    // Get partner details
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, name, city, postal_code, lat, lng, logo_url, slug')
      .eq('id', partnerId)
      .eq('is_active', true)
      .single()

    if (partnerError || !partner) {
      logStep('Partner not found or not active', { error: partnerError })
      return new Response(
        JSON.stringify({ error: 'Partner not found or not active' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logStep('Partner found', { name: partner.name, city: partner.city })

    // Create alert record
    const { data: alert, error: alertError } = await supabase
      .from('new_partner_alerts')
      .insert({
        partner_id: partner.id,
        partner_city: partner.city,
        partner_postal_code: partner.postal_code,
        partner_lat: partner.lat,
        partner_lng: partner.lng,
      })
      .select('id')
      .single()

    if (alertError) {
      logStep('Error creating alert', { error: alertError })
      throw alertError
    }

    logStep('Alert created', { alertId: alert.id })

    // Find users to notify based on location
    // We'll notify users who have:
    // 1. Same city or nearby postal code
    // 2. Active push subscriptions
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, city, postal_code')
      .not('city', 'is', null)

    if (profilesError) {
      logStep('Error fetching profiles', { error: profilesError })
    }

    // Filter users by proximity (same city or nearby postal code prefix)
    const nearbyUserIds: string[] = []
    const partnerPostalPrefix = partner.postal_code?.substring(0, 2)

    for (const profile of profiles || []) {
      // Same city match
      if (profile.city && partner.city && 
          profile.city.toLowerCase() === partner.city.toLowerCase()) {
        nearbyUserIds.push(profile.id)
        continue
      }
      
      // Same postal code region (first 2 digits in Switzerland)
      if (profile.postal_code && partnerPostalPrefix &&
          profile.postal_code.startsWith(partnerPostalPrefix)) {
        nearbyUserIds.push(profile.id)
        continue
      }
    }

    logStep('Found nearby users', { count: nearbyUserIds.length })

    if (nearbyUserIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          alertId: alert.id,
          notificationsSent: 0,
          message: 'No nearby users to notify'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get push subscriptions for nearby users
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .in('user_id', nearbyUserIds)
      .eq('is_active', true)

    if (subError) {
      logStep('Error fetching subscriptions', { error: subError })
    }

    logStep('Found push subscriptions', { count: subscriptions?.length || 0 })

    // Send push notifications
    let sentCount = 0
    let errorCount = 0

    const payload = JSON.stringify({
      title: '🎉 Neu in deiner Nähe!',
      body: `${partner.name} ist jetzt bei My 2Go dabei. Entdecke exklusive Angebote!`,
      icon: partner.logo_url || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: {
        type: 'new_partner',
        partnerId: partner.id,
        partnerSlug: partner.slug,
        url: `/partner/${partner.slug}`
      },
      tag: `new-partner-${partner.id}`,
      requireInteraction: true
    })

    for (const sub of subscriptions || []) {
      try {
        const success = await sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload
        )

        if (success) {
          sentCount++
          logStep('Notification sent', { userId: sub.user_id })
        } else {
          errorCount++
          // Deactivate failed subscription
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('endpoint', sub.endpoint)
        }
      } catch (error) {
        errorCount++
        logStep('Error sending notification', { userId: sub.user_id, error })
      }
    }

    logStep('Notifications complete', { sent: sentCount, errors: errorCount })

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertId: alert.id,
        notificationsSent: sentCount,
        errors: errorCount,
        nearbyUsers: nearbyUserIds.length,
        message: `${sentCount} notifications sent to nearby users`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logStep('ERROR', { message: errorMessage })
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
