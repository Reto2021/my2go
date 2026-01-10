import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReviewRequestSheet } from './ReviewRequestSheet';

interface PendingReviewCheck {
  redemptionId: string;
  partnerId: string;
  partnerName: string;
  googlePlaceId: string | null;
  redeemedAt: string;
}

export function ReviewRequestTrigger() {
  const [pendingReview, setPendingReview] = useState<PendingReviewCheck | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Check for recently redeemed rewards that need review
  const { data: recentRedemptions } = useQuery({
    queryKey: ['recent-redemptions-for-review'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get redemptions from the last 24 hours that are "used" status
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const { data, error } = await supabase
        .from('redemptions')
        .select(`
          id,
          partner_id,
          redeemed_at,
          partners:partner_id (
            name,
            google_place_id,
            review_request_enabled,
            review_request_delay_minutes
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'used')
        .gte('redeemed_at', oneDayAgo.toISOString())
        .order('redeemed_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch redemptions for review:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 60000, // Check every minute
    refetchInterval: 60000,
  });

  // Check for existing review requests to avoid duplicates
  const checkExistingReviewRequest = async (redemptionId: string) => {
    const { data } = await supabase
      .from('review_requests')
      .select('id')
      .eq('redemption_id', redemptionId)
      .maybeSingle();
    
    return !!data;
  };

  useEffect(() => {
    const checkForPendingReview = async () => {
      if (!recentRedemptions || recentRedemptions.length === 0) return;

      for (const redemption of recentRedemptions) {
        const partner = redemption.partners as any;
        if (!partner?.review_request_enabled) continue;

        // Check if enough time has passed since redemption
        const delayMinutes = partner.review_request_delay_minutes || 5;
        const redeemedAt = new Date(redemption.redeemed_at!);
        const now = new Date();
        const minutesSinceRedemption = (now.getTime() - redeemedAt.getTime()) / (1000 * 60);

        if (minutesSinceRedemption < delayMinutes) continue;

        // Check if we already asked for a review
        const hasExisting = await checkExistingReviewRequest(redemption.id);
        if (hasExisting) continue;

        // Found a valid redemption to request review for
        setPendingReview({
          redemptionId: redemption.id,
          partnerId: redemption.partner_id,
          partnerName: partner.name,
          googlePlaceId: partner.google_place_id,
          redeemedAt: redemption.redeemed_at!,
        });

        // Small delay before showing
        setTimeout(() => setIsOpen(true), 1000);
        return;
      }
    };

    checkForPendingReview();
  }, [recentRedemptions]);

  const handleClose = () => {
    setIsOpen(false);
    setPendingReview(null);
  };

  if (!pendingReview) return null;

  return (
    <ReviewRequestSheet
      isOpen={isOpen}
      onClose={handleClose}
      partnerId={pendingReview.partnerId}
      partnerName={pendingReview.partnerName}
      redemptionId={pendingReview.redemptionId}
      googlePlaceId={pendingReview.googlePlaceId}
    />
  );
}
