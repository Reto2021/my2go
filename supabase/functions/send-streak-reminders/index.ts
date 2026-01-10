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
    console.log('Starting streak reminder notification check...')

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

    const today = new Date().toISOString().split('T')[0]

    // Find users who:
    // 1. Have an active streak (claimed yesterday but not today)
    // 2. Have active push subscriptions
    const { data: usersWithStreaks, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        current_streak,
        last_streak_date
      `)
      .gt('current_streak', 0)
      .not('last_streak_date', 'is', null)
      .neq('last_streak_date', today)

    if (usersError) {
      console.error('Error fetching users with streaks:', usersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${usersWithStreaks?.length || 0} users with active streaks who haven't claimed today`)

    if (!usersWithStreaks || usersWithStreaks.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users need reminders', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter to only users who claimed yesterday (streak is still valid)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const usersAtRisk = usersWithStreaks.filter(user => 
      user.last_streak_date === yesterdayStr
    )

    console.log(`${usersAtRisk.length} users are at risk of losing their streak`)

    let sentCount = 0
    let errorCount = 0

    // Send notifications for each user
    for (const user of usersAtRisk) {
      // Get user's push subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (subError || !subscriptions || subscriptions.length === 0) {
        console.log(`No active push subscriptions for user ${user.id}`)
        continue
      }

      // Calculate next bonus
      const nextBonus = Math.min(5 + user.current_streak, 15)
      const streakDays = user.current_streak

      // Create notification payload
      const payload = JSON.stringify({
        title: '🔥 Serien-Erinnerung!',
        body: `Deine ${streakDays}-Tage-Serie ist in Gefahr! Hole dir jetzt ${nextBonus} Bonus-Taler, bevor deine Serie zurückgesetzt wird.`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: {
          url: '/',
          type: 'series-reminder',
        },
        tag: 'series-reminder',
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
            console.log(`Serien-Erinnerung sent to user ${user.id} (${streakDays}-day series)`)
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

    console.log(`Serien-Erinnerung sending complete. Sent: ${sentCount}, Errors: ${errorCount}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${sentCount} series reminders`,
        sent: sentCount,
        errors: errorCount,
        usersAtRisk: usersAtRisk.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send streak reminders error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
