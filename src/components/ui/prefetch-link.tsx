import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import { forwardRef } from 'react';
import { usePrefetchOnInteraction } from '@/lib/route-prefetch';

interface PrefetchLinkProps extends RouterLinkProps {
  prefetch?: boolean;
}

/**
 * Enhanced Link component that prefetches the target route on hover/focus
 */
export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  ({ to, prefetch = true, children, ...props }, ref) => {
    const path = typeof to === 'string' ? to : to.pathname || '';
    const prefetchHandlers = usePrefetchOnInteraction(path);
    
    const handlers = prefetch ? prefetchHandlers : {};
    
    return (
      <RouterLink
        ref={ref}
        to={to}
        {...handlers}
        {...props}
      >
        {children}
      </RouterLink>
    );
  }
);

PrefetchLink.displayName = 'PrefetchLink';
