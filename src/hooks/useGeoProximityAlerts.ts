import { useEffect, useRef, useCallback } from 'react';
import { useAuthSafe } from '@/contexts/AuthContext';
import { useLocation } from '@/lib/location';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GEO_PUSH_RADIUS_KM = 0.5; // 500m
const GEO_PUSH_COOLDOWN_MS = 1000 * 60 * 30; // 30 min per partner
const GEO_PUSH_CHECK_INTERVAL = 1000 * 60 * 2; // Check every 2 min
const GEO_PUSH_STORAGE_KEY = 'geo_push_last_notified';

interface NotifiedPartner {
  partnerId: string;
  timestamp: number;
}

function getNotifiedPartners(): NotifiedPartner[] {
  try {
    return JSON.parse(localStorage.getItem(GEO_PUSH_STORAGE_KEY) || '[]');
  } catch { return []; }
}

function setNotifiedPartner(partnerId: string) {
  const list = getNotifiedPartners().filter(p => Date.now() - p.timestamp < GEO_PUSH_COOLDOWN_MS);
  list.push({ partnerId, timestamp: Date.now() });
  localStorage.setItem(GEO_PUSH_STORAGE_KEY, JSON.stringify(list));
}

function wasRecentlyNotified(partnerId: string): boolean {
  return getNotifiedPartners().some(p => p.partnerId === partnerId && Date.now() - p.timestamp < GEO_PUSH_COOLDOWN_MS);
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Checks user location against partner locations and shows in-app toast notifications.
 * This is a lightweight alternative to native push - runs while app is open.
 */
export function useGeoProximityAlerts() {
  const auth = useAuthSafe();
  const userId = auth?.user?.id;
  const { userLocation } = useLocation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const partnersCache = useRef<Array<{ id: string; name: string; slug: string; lat: number; lng: number }>>([]);
  const lastFetch = useRef(0);

  const fetchPartners = useCallback(async () => {
    // Cache partners for 10 minutes
    if (Date.now() - lastFetch.current < 600_000 && partnersCache.current.length > 0) return;
    
    const { data } = await supabase.rpc('get_public_partners_safe');
    if (data) {
      partnersCache.current = (data as any[])
        .filter(p => p.lat && p.lng)
        .map(p => ({ id: p.id, name: p.name, slug: p.slug, lat: Number(p.lat), lng: Number(p.lng) }));
      lastFetch.current = Date.now();
    }
  }, []);

  const checkProximity = useCallback(async () => {
    if (!userLocation || !userId) return;
    
    await fetchPartners();

    for (const partner of partnersCache.current) {
      const dist = haversineDistance(userLocation.lat, userLocation.lng, partner.lat, partner.lng);
      
      if (dist <= GEO_PUSH_RADIUS_KM && !wasRecentlyNotified(partner.id)) {
        setNotifiedPartner(partner.id);
        toast(`📍 ${partner.name} ist in der Nähe!`, {
          description: `Nur ${dist < 0.1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`} entfernt – löse deine Taler ein!`,
          action: {
            label: 'Ansehen',
            onClick: () => { window.location.href = `/partner/${partner.slug}`; },
          },
          duration: 8000,
        });
        break; // Only one notification at a time
      }
    }
  }, [userLocation, userId, fetchPartners]);

  useEffect(() => {
    if (!userLocation || !userId) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }

    // Check immediately
    checkProximity();

    // Then periodically
    intervalRef.current = setInterval(checkProximity, GEO_PUSH_CHECK_INTERVAL);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [userLocation, userId, checkProximity]);
}
