import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NewPartnerAlert {
  id: string;
  partner_id: string;
  partner_city: string | null;
  partner_postal_code: string | null;
  created_at: string;
  partner?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    city: string | null;
    category: string | null;
  };
}

export function useNewPartners() {
  const { user, profile } = useAuth();
  const [newPartners, setNewPartners] = useState<NewPartnerAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNewPartners, setHasNewPartners] = useState(false);

  useEffect(() => {
    if (!user) {
      setNewPartners([]);
      setHasNewPartners(false);
      setIsLoading(false);
      return;
    }

    fetchNewPartners();
  }, [user, profile?.city, profile?.postal_code]);

  async function fetchNewPartners() {
    try {
      setIsLoading(true);

      // Get alerts from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Fetch alerts and dismissals
      const [alertsResult, dismissalsResult] = await Promise.all([
        supabase
          .from('new_partner_alerts')
          .select('*')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('new_partner_alert_dismissals')
          .select('alert_id')
      ]);

      if (alertsResult.error) {
        console.error('Error fetching alerts:', alertsResult.error);
        return;
      }

      const dismissedAlertIds = new Set(
        (dismissalsResult.data || []).map(d => d.alert_id)
      );

      // Filter out dismissed alerts
      const undismissedAlerts = (alertsResult.data || []).filter(
        alert => !dismissedAlertIds.has(alert.id)
      );

      // Filter by user's location if available
      const userCity = profile?.city?.toLowerCase();
      const userPostalPrefix = profile?.postal_code?.substring(0, 2);

      const nearbyAlerts = undismissedAlerts.filter(alert => {
        // If user has no location, show all
        if (!userCity && !userPostalPrefix) return true;

        // Match by city
        if (userCity && alert.partner_city?.toLowerCase() === userCity) {
          return true;
        }

        // Match by postal code prefix (Swiss region)
        if (userPostalPrefix && alert.partner_postal_code?.startsWith(userPostalPrefix)) {
          return true;
        }

        return false;
      });

      // Fetch partner details for each alert using the public function
      const partnersWithDetails: NewPartnerAlert[] = [];
      
      for (const alert of nearbyAlerts) {
        const { data: partnerData } = await supabase
          .rpc('get_public_partner_by_id', { partner_id: alert.partner_id });

        if (partnerData && partnerData.length > 0) {
          partnersWithDetails.push({
            ...alert,
            partner: {
              id: partnerData[0].id,
              name: partnerData[0].name,
              slug: partnerData[0].slug,
              logo_url: partnerData[0].logo_url,
              city: partnerData[0].city,
              category: partnerData[0].category,
            }
          });
        }
      }

      setNewPartners(partnersWithDetails);
      setHasNewPartners(partnersWithDetails.length > 0);
    } catch (error) {
      console.error('Error in fetchNewPartners:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function dismissAlert(alertId: string) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('new_partner_alert_dismissals')
        .insert({
          user_id: user.id,
          alert_id: alertId,
        });

      if (error) {
        console.error('Error dismissing alert:', error);
        return;
      }

      // Update local state
      setNewPartners(prev => prev.filter(p => p.id !== alertId));
      setHasNewPartners(newPartners.length > 1);
    } catch (error) {
      console.error('Error in dismissAlert:', error);
    }
  }

  async function dismissAll() {
    if (!user || newPartners.length === 0) return;

    try {
      const dismissals = newPartners.map(alert => ({
        user_id: user.id,
        alert_id: alert.id,
      }));

      const { error } = await supabase
        .from('new_partner_alert_dismissals')
        .insert(dismissals);

      if (error) {
        console.error('Error dismissing all alerts:', error);
        return;
      }

      setNewPartners([]);
      setHasNewPartners(false);
    } catch (error) {
      console.error('Error in dismissAll:', error);
    }
  }

  return {
    newPartners,
    hasNewPartners,
    isLoading,
    dismissAlert,
    dismissAll,
    refetch: fetchNewPartners,
  };
}
