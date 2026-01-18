import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting Plus expiry email notification check...')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find users with subscriptions expiring in exactly 3 days
    const now = new Date()
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const in3DaysStart = new Date(in3Days.setHours(0, 0, 0, 0))
    const in3DaysEnd = new Date(in3Days.setHours(23, 59, 59, 999))

    const { data: expiringProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, first_name, subscription_status, subscription_tier, subscription_ends_at')
      .eq('subscription_status', 'active')
      .gte('subscription_ends_at', in3DaysStart.toISOString())
      .lte('subscription_ends_at', in3DaysEnd.toISOString())

    if (profilesError) {
      console.error('Error fetching expiring profiles:', profilesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${expiringProfiles?.length || 0} profiles with Plus expiring in 3 days`)

    if (!expiringProfiles || expiringProfiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No expiring Plus subscriptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let sentCount = 0
    let errorCount = 0

    // Send emails for each user
    for (const profile of expiringProfiles) {
      if (!profile.email) {
        console.log(`No email for user ${profile.id}, skipping`)
        continue
      }

      const userName = profile.first_name || profile.display_name || 'Lieber 2Go Hörer'
      const tierName = profile.subscription_tier === 'taler' ? 'Taler-Plus' : '2Go Plus'
      const expiryDate = new Date(profile.subscription_ends_at!)
      const formattedDate = expiryDate.toLocaleDateString('de-CH', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })

      // Generate a unique discount code for this user
      const discountCode = `PLUS10-${profile.id.substring(0, 8).toUpperCase()}`

      try {
        const emailResponse = await resend.emails.send({
          from: '2Go Radio <noreply@my2go.ch>',
          to: [profile.email],
          subject: `⏰ Dein ${tierName} läuft in 3 Tagen ab - 10% Verlängerungsrabatt!`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tierName} Verlängerung</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">👑 ${tierName}</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Verlängerungsangebot</p>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hallo ${userName}! 👋</p>
    
    <p>Dein <strong>${tierName}</strong> Abo läuft am <strong>${formattedDate}</strong> ab.</p>
    
    <p>Damit du weiterhin alle Premium-Vorteile geniessen kannst, haben wir ein exklusives Angebot für dich:</p>
    
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px solid #f59e0b;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">Exklusiver Rabatt</p>
      <p style="margin: 0; font-size: 32px; font-weight: bold; color: #78350f;">10% RABATT</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">auf deine Verlängerung</p>
    </div>
    
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 5px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Dein persönlicher Code</p>
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937; font-family: monospace; letter-spacing: 2px;">${discountCode}</p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">Dieser Code ist 7 Tage gültig und kann nur einmal verwendet werden.</p>
    
    <h3 style="margin-top: 30px; color: #1f2937;">Deine ${tierName} Vorteile:</h3>
    <ul style="padding-left: 20px; color: #4b5563;">
      <li>✨ Exklusive Premium-Rewards</li>
      <li>🎁 Höhere Rabatte & 2-für-1 Deals</li>
      <li>⭐ VIP-Erlebnisse bei Partnern</li>
      <li>🚀 Früher Zugang zu neuen Aktionen</li>
    </ul>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://my2go.app/settings" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px;">Jetzt verlängern →</a>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
      Fragen? Schreib uns einfach eine Nachricht!<br>
      Dein 2Go Radio Team 🎵
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>© 2025 2Go Radio. Alle Rechte vorbehalten.</p>
    <p>Du erhältst diese E-Mail, weil du ${tierName} Abonnent bist.</p>
  </div>
</body>
</html>
          `,
        })

        if (emailResponse.error) {
          console.error(`Error sending email to ${profile.email}:`, emailResponse.error)
          errorCount++
        } else {
          console.log(`Email sent successfully to ${profile.email}`)
          sentCount++

          // Store the discount code in system_settings or a dedicated table
          await supabase
            .from('system_settings')
            .upsert({
              key: `plus_renewal_discount_${profile.id}`,
              value: { 
                code: discountCode, 
                discount_percent: 10,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                used: false
              },
              description: `Plus renewal discount for user ${profile.id}`,
              is_public: false,
              updated_at: new Date().toISOString()
            }, { onConflict: 'key' })
        }
      } catch (err) {
        console.error(`Error sending email to ${profile.email}:`, err)
        errorCount++
      }
    }

    console.log(`Plus expiry email sending complete. Sent: ${sentCount}, Errors: ${errorCount}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${sentCount} Plus expiry emails with 10% discount`,
        sent: sentCount,
        errors: errorCount,
        profilesChecked: expiringProfiles.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Send Plus expiry emails error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
