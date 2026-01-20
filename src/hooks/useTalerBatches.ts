import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TalerBatch {
  earn_month: string;
  amount_remaining: number;
  expires_at: string;
  status: 'active' | 'expiring_soon' | 'expired';
}

export interface TalerBatchSummary {
  batches: TalerBatch[];
  totalExpiringSoon: number;
  nextExpiryDate: string | null;
  nextExpiryAmount: number;
  isLoading: boolean;
}

export function useTalerBatches(userId: string | null): TalerBatchSummary {
  const [batches, setBatches] = useState<TalerBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    if (!userId) {
      setBatches([]);
      setIsLoading(false);
      return;
    }

    try {
      // Query the view for batch summary
      const { data, error } = await supabase
        .from('user_taler_batch_summary')
        .select('earn_month, amount_remaining, expires_at, status')
        .eq('user_id', userId)
        .gt('amount_remaining', 0)
        .order('earn_month', { ascending: true });

      if (error) {
        console.error('Error fetching taler batches:', error);
        setBatches([]);
      } else {
        setBatches((data || []) as TalerBatch[]);
      }
    } catch (err) {
      console.error('Error fetching taler batches:', err);
      setBatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Calculate summary stats
  const activeBatches = batches.filter(b => b.status !== 'expired');
  const expiringSoonBatches = batches.filter(b => b.status === 'expiring_soon');
  
  const totalExpiringSoon = expiringSoonBatches.reduce(
    (sum, b) => sum + b.amount_remaining, 
    0
  );

  // Find next expiry (earliest non-expired batch)
  const nextExpiry = activeBatches.length > 0 ? activeBatches[0] : null;

  return {
    batches: activeBatches,
    totalExpiringSoon,
    nextExpiryDate: nextExpiry?.expires_at || null,
    nextExpiryAmount: nextExpiry?.amount_remaining || 0,
    isLoading,
  };
}

// Helper to format month name
export function formatMonthName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
}

// Helper to format expiry date
export function formatExpiryDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-CH', { day: 'numeric', month: 'long' });
}

// Calculate days until expiry
export function daysUntilExpiry(dateStr: string): number {
  const expiryDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
