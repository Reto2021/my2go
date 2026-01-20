import { Reward, PartnerWithMinCost } from '@/lib/supabase-helpers';

export interface BrowseModeHomeProps {
  rewards: Reward[];
  partners: PartnerWithMinCost[];
  isLoading: boolean;
  onLogin: () => void;
}

export interface SessionModeHomeProps {
  displayName?: string | null;
  userId?: string | null;
  balance: { taler_balance: number; lifetime_earned: number; lifetime_spent: number };
  rewards: Reward[];
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  onClearLocation: () => void;
  onRequestLocation: () => Promise<void>;
  isRequestingLocation: boolean;
}

export interface FeatureChipProps {
  icon: React.ElementType;
  label: string;
  fullLabel?: string;
  color: 'accent' | 'primary' | 'secondary';
  to: string;
}

export interface QuickActionProps {
  to: string;
  icon: React.ElementType;
  label: string;
  color: 'accent' | 'primary' | 'secondary';
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export const colorClasses = {
  accent: 'bg-accent/15 text-accent',
  primary: 'bg-primary/20 text-secondary',
  secondary: 'bg-secondary/10 text-secondary',
} as const;
