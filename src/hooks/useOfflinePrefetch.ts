import { useEffect, useRef, useState } from 'react';
import { getPartners, getRewards } from '@/lib/supabase-helpers';
import { prefetchOfflineData } from './useOfflineData';
import { useOnlineStatus } from './useOnlineStatus';

// Prefetch configuration
const PREFETCH_DELAY_MS = 2000; // Wait 2 seconds after app load
const PREFETCH_KEY = 'my2go_last_prefetch';
const PREFETCH_INTERVAL_MS = 30 * 60 * 1000; // Refresh every 30 minutes

interface UsePrefetchOptions {
  /** Delay before starting prefetch (ms) */
  delay?: number;
  /** Minimum interval between prefetches (ms) */
  interval?: number;
  /** Only prefetch when on WiFi (not implemented, future enhancement) */
  wifiOnly?: boolean;
}

export function useOfflinePrefetch(options: UsePrefetchOptions = {}) {
  const { delay = PREFETCH_DELAY_MS, interval = PREFETCH_INTERVAL_MS } = options;
  
  const { isOnline } = useOnlineStatus();
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [lastPrefetch, setLastPrefetch] = useState<Date | null>(null);
  const [prefetchError, setPrefetchError] = useState<Error | null>(null);
  const hasInitialPrefetch = useRef(false);
  
  // Check if prefetch is needed based on last prefetch time
  const shouldPrefetch = (): boolean => {
    const lastPrefetchTime = localStorage.getItem(PREFETCH_KEY);
    if (!lastPrefetchTime) return true;
    
    const elapsed = Date.now() - parseInt(lastPrefetchTime, 10);
    return elapsed > interval;
  };
  
  // Perform the prefetch
  const doPrefetch = async (): Promise<boolean> => {
    if (!isOnline || isPrefetching) return false;
    
    console.log('[Prefetch] Starting offline data prefetch...');
    setIsPrefetching(true);
    setPrefetchError(null);
    
    try {
      const success = await prefetchOfflineData(
        async () => await getPartners(),
        async () => await getRewards()
      );
      
      if (success) {
        const now = Date.now();
        localStorage.setItem(PREFETCH_KEY, now.toString());
        setLastPrefetch(new Date(now));
        console.log('[Prefetch] Offline data prefetch completed successfully');
      }
      
      return success;
    } catch (error) {
      console.error('[Prefetch] Failed to prefetch offline data:', error);
      setPrefetchError(error instanceof Error ? error : new Error('Prefetch failed'));
      return false;
    } finally {
      setIsPrefetching(false);
    }
  };
  
  // Manual refresh trigger
  const refresh = async () => {
    return doPrefetch();
  };
  
  // Initial prefetch on app load
  useEffect(() => {
    if (hasInitialPrefetch.current) return;
    
    // Load last prefetch time
    const lastPrefetchTime = localStorage.getItem(PREFETCH_KEY);
    if (lastPrefetchTime) {
      setLastPrefetch(new Date(parseInt(lastPrefetchTime, 10)));
    }
    
    // Delay the prefetch to not block initial page load
    const timeoutId = setTimeout(() => {
      if (isOnline && shouldPrefetch()) {
        hasInitialPrefetch.current = true;
        doPrefetch();
      }
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [isOnline, delay]);
  
  // Prefetch when coming back online
  useEffect(() => {
    if (isOnline && shouldPrefetch() && hasInitialPrefetch.current) {
      doPrefetch();
    }
  }, [isOnline]);
  
  // Background refresh on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOnline && shouldPrefetch()) {
        doPrefetch();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isOnline]);
  
  return {
    isPrefetching,
    lastPrefetch,
    prefetchError,
    refresh,
  };
}

// Provider component to initialize prefetch at app level
interface OfflinePrefetchProviderProps {
  children: React.ReactNode;
}

export function OfflinePrefetchProvider({ children }: OfflinePrefetchProviderProps) {
  useOfflinePrefetch();
  return children;
}
