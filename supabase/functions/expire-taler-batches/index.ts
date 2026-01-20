import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting Taler batch expiration process...');

    // Step 0: Get all Plus users (their Taler expire after 12 months instead of 6)
    const { data: plusUsers, error: plusError } = await supabase
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active')
      .gt('subscription_ends_at', new Date().toISOString());
    
    const plusUserIds = plusUsers?.map(u => u.id) || [];
    console.log(`Found ${plusUserIds.length} active Plus users (12 months Taler validity)`);

    // Step 1: Expire old batches (those past their expires_at date)
    const { data: expiredBatches, error: expireError } = await supabase
      .rpc('expire_old_taler_batches');

    if (expireError) {
      console.error('Error expiring batches:', expireError);
      throw expireError;
    }

    // Step 1b: For Plus users, extend their Taler batches to 12 months instead of 6
    // This extends batches that would normally expire at 6 months to 12 months
    if (plusUserIds.length > 0) {
      // Calculate 12 months from now for extension
      const twelveMonthsFromNow = new Date();
      twelveMonthsFromNow.setMonth(twelveMonthsFromNow.getMonth() + 12);

      // Get batches that are expiring soon (within next 30 days) for Plus users
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Extend expiry for Plus users' batches that are about to expire within 30 days
      const { data: extendedBatches, error: extendError } = await supabase
        .from('taler_monthly_batches')
        .update({ 
          expires_at: twelveMonthsFromNow.toISOString() 
        })
        .in('user_id', plusUserIds)
        .lt('expires_at', thirtyDaysFromNow.toISOString())
        .select('id');

      if (extendError) {
        console.error('Error extending Plus user batches:', extendError);
      } else {
        console.log(`Extended expiry for ${extendedBatches?.length || 0} Plus user batches to 12 months`);
      }
    }

    // Filter out Plus users from expired batches (they shouldn't expire within 6 months)
    const filteredExpiredBatches = expiredBatches?.filter(
      (batch: any) => !plusUserIds.includes(batch.user_id)
    ) || [];
    
    console.log(`Expired ${filteredExpiredBatches.length} batches (excluded ${(expiredBatches?.length || 0) - filteredExpiredBatches.length} Plus user batches)`);

    // Step 2: Get users with expiring talers next month (for notifications)
    const { data: expiringNext, error: expiringError } = await supabase
      .rpc('get_expiring_talers_next_month');

    if (expiringError) {
      console.error('Error getting expiring talers:', expiringError);
    }

    // Filter out Plus users from expiring notifications (they have extended validity)
    const filteredExpiringNext = expiringNext?.filter(
      (batch: any) => !plusUserIds.includes(batch.user_id)
    ) || [];

    console.log(`Found ${filteredExpiringNext.length} users with talers expiring next month (excluded Plus users)`);

    // Step 3: Send notifications to users with expiring talers
    const notificationResults = [];
    
    if (filteredExpiringNext && filteredExpiringNext.length > 0) {
      for (const batch of filteredExpiringNext) {
        // Get user profile for notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, push_subscriptions')
          .eq('id', batch.user_id)
          .single();

        if (profile?.push_subscriptions && Array.isArray(profile.push_subscriptions)) {
          // Send push notification
          const monthName = new Date(batch.earn_month).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
          
          for (const subscription of profile.push_subscriptions) {
            try {
              const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
              const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
              
              if (vapidPrivateKey && vapidPublicKey) {
                console.log(`Would send push to user ${batch.user_id}: ${batch.amount_expiring} Taler aus ${monthName} verfallen bald!`);
                notificationResults.push({
                  user_id: batch.user_id,
                  amount: batch.amount_expiring,
                  month: monthName,
                  status: 'logged'
                });
              }
            } catch (pushError) {
              console.error(`Push error for user ${batch.user_id}:`, pushError);
            }
          }
        }

        // Also create in-app notification
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: batch.user_id,
            type: 'taler_expiring',
            title: 'Taler verfallen bald!',
            message: `${batch.amount_expiring} Taler aus ${new Date(batch.earn_month).toLocaleDateString('de-CH', { month: 'long' })} verfallen am ${new Date(batch.expires_at).toLocaleDateString('de-CH')}. Jetzt einlösen oder mit 2Go Plus verlängern!`,
            data: {
              amount: batch.amount_expiring,
              earn_month: batch.earn_month,
              expires_at: batch.expires_at
            }
          });

        if (notifError && !notifError.message?.includes('does not exist')) {
          console.error(`Notification insert error for user ${batch.user_id}:`, notifError);
        }
      }
    }

    // Step 4: Log summary for expired batches
    if (filteredExpiredBatches && filteredExpiredBatches.length > 0) {
      const totalExpired = filteredExpiredBatches.reduce((sum: number, b: any) => sum + (b.expired_amount || 0), 0);
      console.log(`Total Taler expired: ${totalExpired} across ${filteredExpiredBatches.length} users`);

      // Notify users whose talers just expired
      for (const expired of filteredExpiredBatches) {
        const { error: expiredNotifError } = await supabase
          .from('notifications')
          .insert({
            user_id: expired.user_id,
            type: 'taler_expired',
            title: 'Taler verfallen',
            message: `${expired.expired_amount} Taler aus ${new Date(expired.earn_month).toLocaleDateString('de-CH', { month: 'long' })} sind leider verfallen. Tipp: Mit 2Go Plus hast du 12 Monate Gültigkeit!`,
            data: {
              amount: expired.expired_amount,
              earn_month: expired.earn_month
            }
          });

        if (expiredNotifError && !expiredNotifError.message?.includes('does not exist')) {
          console.error(`Expired notification error for user ${expired.user_id}:`, expiredNotifError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired_batches: filteredExpiredBatches?.length || 0,
        total_expired_amount: filteredExpiredBatches?.reduce((sum: number, b: any) => sum + (b.expired_amount || 0), 0) || 0,
        users_notified_expiring_soon: filteredExpiringNext?.length || 0,
        plus_users_extended: plusUserIds.length,
        notification_results: notificationResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Taler expiration error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});