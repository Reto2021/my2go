import { useCallback, useEffect, useRef } from 'react';

// Track which routes have been prefetched
const prefetchedRoutes = new Set<string>();

// Map of route paths to their dynamic import functions
const routeImports: Record<string, () => Promise<unknown>> = {
  '/rewards': () => import('@/pages/RewardsPage'),
  '/partner': () => import('@/pages/PartnerPage'),
  '/code': () => import('@/pages/CodePage'),
  '/settings': () => import('@/pages/SettingsPage'),
  '/profile': () => import('@/pages/ProfilePage'),
  // '/my-redemptions' removed - now integrated in RewardsPage
  '/badges': () => import('@/pages/BadgesPage'),
  '/leaderboard': () => import('@/pages/LeaderboardPage'),
  '/referral': () => import('@/pages/ReferralPage'),
  '/faq': () => import('@/pages/FAQPage'),
  '/auth': () => import('@/pages/AuthPage'),
};

/**
 * Prefetch a route's code bundle
 */
export function prefetchRoute(path: string): void {
  // Normalize path
  const normalizedPath = path.split('?')[0].split('#')[0];
  
  // Skip if already prefetched
  if (prefetchedRoutes.has(normalizedPath)) return;
  
  // Check if we have an import for this route
  const importFn = routeImports[normalizedPath];
  if (importFn) {
    prefetchedRoutes.add(normalizedPath);
    // Use requestIdleCallback for non-blocking prefetch
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFn().catch(() => {
          // Remove from set if prefetch fails so it can be retried
          prefetchedRoutes.delete(normalizedPath);
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        importFn().catch(() => {
          prefetchedRoutes.delete(normalizedPath);
        });
      }, 100);
    }
  }
}

/**
 * Prefetch multiple routes
 */
export function prefetchRoutes(paths: string[]): void {
  paths.forEach(prefetchRoute);
}

/**
 * Hook to prefetch routes on component mount
 */
export function usePrefetchRoutes(paths: string[]): void {
  useEffect(() => {
    // Small delay to not interfere with initial render
    const timer = setTimeout(() => {
      prefetchRoutes(paths);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
}

/**
 * Hook to prefetch a route on hover/focus
 */
export function usePrefetchOnInteraction(path: string) {
  const prefetched = useRef(false);
  
  const handleInteraction = useCallback(() => {
    if (!prefetched.current) {
      prefetched.current = true;
      prefetchRoute(path);
    }
  }, [path]);
  
  return {
    onMouseEnter: handleInteraction,
    onFocus: handleInteraction,
    onTouchStart: handleInteraction,
  };
}

/**
 * Prefetch common routes after initial page load
 * Call this once in your app after hydration
 */
export function prefetchCommonRoutes(): void {
  // Wait for initial load to complete
  if (document.readyState === 'complete') {
    schedulePrefetch();
  } else {
    window.addEventListener('load', schedulePrefetch, { once: true });
  }
}

function schedulePrefetch(): void {
  // Use requestIdleCallback to prefetch during idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Prefetch most common routes
      prefetchRoutes(['/rewards', '/partner', '/code']);
    }, { timeout: 3000 });
    
    // Prefetch secondary routes after a longer delay
    requestIdleCallback(() => {
      prefetchRoutes(['/settings', '/badges']);
    }, { timeout: 5000 });
  } else {
    // Fallback
    setTimeout(() => {
      prefetchRoutes(['/rewards', '/partner', '/code']);
    }, 2000);
    
    setTimeout(() => {
      prefetchRoutes(['/settings', '/badges']);
    }, 4000);
  }
}
