import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to track QR code scans when a partner page is visited with UTM parameters
 * Uses a secure edge function with rate limiting and IP-based deduplication
 */
export function useQRScanTracking(partnerId: string | undefined) {
  const [searchParams] = useSearchParams();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current || !partnerId) return;

    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    // Only track if UTM params are present (indicates a QR scan or campaign link)
    if (!utmSource && !utmMedium && !utmCampaign) return;

    hasTracked.current = true;

    const trackScan = async () => {
      try {
        const response = await supabase.functions.invoke('track-qr-scan', {
          body: {
            partner_id: partnerId,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
          },
        });

        if (response.error) {
          console.error('Failed to track QR scan:', response.error);
          return;
        }

        const data = response.data;
        if (data?.success) {
          if (data.deduplicated) {
            console.log('QR scan deduplicated (already tracked recently)');
          } else {
            console.log('QR scan tracked:', { partnerId, utmSource, utmMedium, utmCampaign });
          }
        } else if (data?.error === 'Rate limit exceeded') {
          console.warn('QR scan rate limit exceeded');
        }
      } catch (error) {
        console.error('Failed to track QR scan:', error);
      }
    };

    trackScan();
  }, [partnerId, searchParams]);
}
