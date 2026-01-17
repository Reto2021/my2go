import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to track QR code scans when a partner page is visited with UTM parameters
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
        // Get current user if logged in
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('qr_scans').insert({
          partner_id: partnerId,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          user_id: user?.id || null,
        });

        console.log('QR scan tracked:', { partnerId, utmSource, utmMedium, utmCampaign });
      } catch (error) {
        console.error('Failed to track QR scan:', error);
      }
    };

    trackScan();
  }, [partnerId, searchParams]);
}
