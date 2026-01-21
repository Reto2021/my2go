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

    // Step 1: Get all active Plus users (subscription_status = 'active' and not expired)
    const { data: plusUsers, error: plusError } = await supabase
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active')
      .gt('subscription_ends_at', new Date().toISOString());
    
    if (plusError) {
      console.error('Error fetching Plus users:', plusError);
    }
    
    const plusUserIds = plusUsers?.map(u => u.id) || [];
    console.log(`Found ${plusUserIds.length} active Plus users (12 months Taler validity)`);

    // Step 2: BEFORE expiring anything, extend Plus users' batches to 12 months
    // This ensures their Taler don't get caught in the expiration sweep
    if (plusUserIds.length > 0) {
      // Calculate 12 months from the original earn date for proper extension
      // We update batches that are within their 6-month window but would be 
      // expired under normal rules - extend them to 12 months from earn_month
      const now = new Date();
      
      // Get all batches for Plus users that have remaining balance and would expire under 6-month rule
      const { data: plusBatches, error: fetchPlusError } = await supabase
        .from('taler_monthly_batches')
        .select('id, user_id, earn_month, expires_at, amount_earned, amount_redeemed, amount_expired')
        .in('user_id', plusUserIds)
        .lt('expires_at', now.toISOString()); // Already expired or about to expire

      if (fetchPlusError) {
        console.error('Error fetching Plus user batches:', fetchPlusError);
      } else if (plusBatches && plusBatches.length > 0) {
        // For each batch, calculate 12 months from earn_month
        let extendedCount = 0;
        for (const batch of plusBatches) {
          const remainingBalance = batch.amount_earned - batch.amount_redeemed - batch.amount_expired;
          if (remainingBalance <= 0) continue; // Skip already depleted batches

          // Calculate 12 months from the start of earn_month
          const earnDate = new Date(batch.earn_month + '-01');
          const newExpiry = new Date(earnDate);
          newExpiry.setMonth(newExpiry.getMonth() + 12);
          
          // Only extend if the new expiry is in the future
          if (newExpiry > now) {
            const { error: updateError } = await supabase
              .from('taler_monthly_batches')
              .update({ expires_at: newExpiry.toISOString() })
              .eq('id', batch.id);
            
            if (!updateError) {
              extendedCount++;
              console.log(`Extended batch ${batch.id} for Plus user ${batch.user_id} to ${newExpiry.toISOString()}`);
            }
          }
        }
        console.log(`Extended ${extendedCount} batches for Plus users to 12-month validity`);
      }
    }

    // Step 3: Now expire old batches (those past their expires_at date)
    // Plus user batches have already been extended, so they won't be affected
    const { data: expiredBatches, error: expireError } = await supabase
      .rpc('expire_old_taler_batches');

    if (expireError) {
      console.error('Error expiring batches:', expireError);
      throw expireError;
    }

    // Filter out Plus users from the expired list for reporting (they shouldn't have expired)
    const standardExpiredBatches = expiredBatches?.filter(
      (batch: any) => !plusUserIds.includes(batch.user_id)
    ) || [];
    
    console.log(`Expired ${standardExpiredBatches.length} batches for standard users`);

    // Step 4: Get users with expiring Taler next month (for notifications)
    const { data: expiringNext, error: expiringError } = await supabase
      .rpc('get_expiring_talers_next_month');

    if (expiringError) {
      console.error('Error getting expiring talers:', expiringError);
    }

    // Filter out Plus users from expiring notifications (they have extended validity)
    const filteredExpiringNext = expiringNext?.filter(
      (batch: any) => !plusUserIds.includes(batch.user_id)
    ) || [];

    console.log(`Found ${filteredExpiringNext.length} standard users with talers expiring next month`);

    // Step 5: Create notifications for users with expiring Taler
    const notificationResults = [];
    
    for (const batch of filteredExpiringNext || []) {
      const monthName = new Date(batch.earn_month).toLocaleDateString('de-CH', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      // Log for now (push notifications require VAPID keys)
      console.log(`User ${batch.user_id}: ${batch.amount_expiring} Taler from ${monthName} expiring soon`);
      notificationResults.push({
        user_id: batch.user_id,
        amount: batch.amount_expiring,
        month: monthName,
        status: 'logged'
      });
    }

    // Step 6: Log summary for expired batches and notify affected users
    if (standardExpiredBatches.length > 0) {
      const totalExpired = standardExpiredBatches.reduce(
        (sum: number, b: any) => sum + (b.expired_amount || 0), 
        0
      );
      console.log(`Total Taler expired: ${totalExpired} across ${standardExpiredBatches.length} users`);

      // Notify users whose Taler just expired
      for (const expired of standardExpiredBatches) {
        const monthName = new Date(expired.earn_month).toLocaleDateString('de-CH', { 
          month: 'long' 
        });
        console.log(`User ${expired.user_id}: ${expired.expired_amount} Taler from ${monthName} have expired`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired_batches: standardExpiredBatches.length,
        total_expired_amount: standardExpiredBatches.reduce(
          (sum: number, b: any) => sum + (b.expired_amount || 0), 
          0
        ),
        users_notified_expiring_soon: filteredExpiringNext?.length || 0,
        plus_users_protected: plusUserIds.length,
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
