import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, calculateDistance } from '@/lib/location';

const REGION_CACHE_KEY = 'cached_region';
const REGION_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export interface Region {
  id: string;
  name: string;
  slug: string;
  lat: number | null;
  lng: number | null;
  radius_km: number | null;
}

interface CachedRegion {
  region: Region;
  timestamp: number;
}

function getCachedRegion(): Region | null {
  try {
    const raw = localStorage.getItem(REGION_CACHE_KEY);
    if (!raw) return null;
    const cached: CachedRegion = JSON.parse(raw);
    if (Date.now() - cached.timestamp > REGION_CACHE_TTL) {
      localStorage.removeItem(REGION_CACHE_KEY);
      return null;
    }
    return cached.region;
  } catch {
    return null;
  }
}

function setCachedRegion(region: Region) {
  try {
    const cached: CachedRegion = { region, timestamp: Date.now() };
    localStorage.setItem(REGION_CACHE_KEY, JSON.stringify(cached));
  } catch {}
}

export function useRegion() {
  const [region, setRegion] = useState<Region | null>(getCachedRegion);
  const [isLoading, setIsLoading] = useState(!getCachedRegion());
  const userLocation = useLocation((s) => s.userLocation);

  useEffect(() => {
    // If we have a valid cache, skip
    const cached = getCachedRegion();
    if (cached) {
      setRegion(cached);
      setIsLoading(false);
      return;
    }

    if (!userLocation) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function detectRegion() {
      try {
        const { data: regions, error } = await supabase
          .from('regions')
          .select('id, name, slug, lat, lng, radius_km');

        if (error || !regions?.length) {
          setIsLoading(false);
          return;
        }

        let bestRegion: Region | null = null;
        let bestDistance = Infinity;

        for (const r of regions) {
          if (r.lat == null || r.lng == null || r.radius_km == null) continue;
          const dist = calculateDistance(
            userLocation!.lat,
            userLocation!.lng,
            r.lat,
            r.lng
          );
          if (dist <= r.radius_km && dist < bestDistance) {
            bestDistance = dist;
            bestRegion = r as Region;
          }
        }

        if (!cancelled) {
          if (bestRegion) {
            setCachedRegion(bestRegion);
          }
          setRegion(bestRegion);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    detectRegion();
    return () => { cancelled = true; };
  }, [userLocation]);

  return { region, isLoading };
}
