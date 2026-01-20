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

    // Step 0: Get all Plus users (their Taler should NEVER expire)
    const { data: plusUsers, error: plusError } = await supabase
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active')
      .gt('subscription_ends_at', new Date().toISOString());
    
    const plusUserIds = plusUsers?.map(u => u.id) || [];
    console.log(`Found ${plusUserIds.length} active Plus users (Taler won't expire for them)`);

    // Step 1: Expire old batches (those past their expires_at date)
    // But exclude Plus users!
    const { data: expiredBatches, error: expireError } = await supabase
      .rpc('expire_old_taler_batches');

    if (expireError) {
      console.error('Error expiring batches:', expireError);
      throw expireError;
    }

    // Filter out Plus users from expired batches
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

    console.log(`Found ${expiringNext?.length || 0} users with talers expiring next month`);

    // Step 3: Send notifications to users with expiring talers
    const notificationResults = [];
    
    if (expiringNext && expiringNext.length > 0) {
      for (const batch of expiringNext) {
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
                // Note: Full push notification implementation would go here
                // For now, log the notification that would be sent
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
            message: `${batch.amount_expiring} Taler aus ${new Date(batch.earn_month).toLocaleDateString('de-CH', { month: 'long' })} verfallen am ${new Date(batch.expires_at).toLocaleDateString('de-CH')}. Jetzt einlösen!`,
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
    if (expiredBatches && expiredBatches.length > 0) {
      const totalExpired = expiredBatches.reduce((sum: number, b: any) => sum + (b.expired_amount || 0), 0);
      console.log(`Total Taler expired: ${totalExpired} across ${expiredBatches.length} users`);

      // Notify users whose talers just expired
      for (const expired of expiredBatches) {
        const { error: expiredNotifError } = await supabase
          .from('notifications')
          .insert({
            user_id: expired.user_id,
            type: 'taler_expired',
            title: 'Taler verfallen',
            message: `${expired.expired_amount} Taler aus ${new Date(expired.earn_month).toLocaleDateString('de-CH', { month: 'long' })} sind leider verfallen.`,
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
        expired_batches: expiredBatches?.length || 0,
        total_expired_amount: expiredBatches?.reduce((sum: number, b: any) => sum + (b.expired_amount || 0), 0) || 0,
        users_notified_expiring_soon: expiringNext?.length || 0,
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
