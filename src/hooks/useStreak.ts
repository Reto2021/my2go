import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMilestoneStore, checkMilestoneCrossed, getMilestoneData } from "@/lib/milestone-store";

interface StreakStatus {
  current_streak: number;
  longest_streak: number;
  can_claim: boolean;
  streak_active: boolean;
  next_bonus: number;
  last_claim_date: string | null;
  streak_freezes: number;
  freeze_cost: number;
}

interface ClaimResult {
  success: boolean;
  already_claimed: boolean;
  current_streak: number;
  longest_streak?: number;
  bonus: number;
  message: string;
  used_freeze?: boolean;
  freezes_remaining?: number;
}

interface PurchaseFreezeResult {
  success: boolean;
  error?: string;
  freezes?: number;
  cost?: number;
  message?: string;
  required?: number;
  balance?: number;
}

export function useStreak() {
  const { user, refreshBalance } = useAuth();
  const queryClient = useQueryClient();
  const { triggerMilestone } = useMilestoneStore();
  const prevStreakRef = useRef<number | null>(null);

  // Get streak status
  const { data: streakStatus, isLoading } = useQuery({
    queryKey: ["streak-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("get_streak_status", { _user_id: user.id });
      if (error) throw error;
      return data as unknown as StreakStatus;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  // Claim daily streak
  const claimStreak = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.rpc("claim_daily_streak", { _user_id: user.id });
      if (error) throw error;
      return data as unknown as ClaimResult;
    },
    onSuccess: (data) => {
      if (data.success) {
        // Check for streak milestones
        if (prevStreakRef.current !== null && data.current_streak) {
          const crossedMilestone = checkMilestoneCrossed(
            'streak',
            data.current_streak,
            prevStreakRef.current
          );
          if (crossedMilestone) {
            triggerMilestone(getMilestoneData('streak', crossedMilestone));
          }
        }
        prevStreakRef.current = data.current_streak;
        
        queryClient.invalidateQueries({ queryKey: ["streak-status"] });
        queryClient.invalidateQueries({ queryKey: ["user-badges"] });
        queryClient.invalidateQueries({ queryKey: ["unseen-badges"] });
        refreshBalance();
      }
    },
  });

  // Purchase streak freeze
  const purchaseFreeze = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.rpc("purchase_streak_freeze", { _user_id: user.id });
      if (error) throw error;
      return data as unknown as PurchaseFreezeResult;
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["streak-status"] });
        refreshBalance();
      }
    },
  });

  return {
    streakStatus,
    isLoading,
    claimStreak: claimStreak.mutate,
    claimResult: claimStreak.data,
    isClaiming: claimStreak.isPending,
    purchaseFreeze: purchaseFreeze.mutate,
    purchaseResult: purchaseFreeze.data,
    isPurchasing: purchaseFreeze.isPending,
  };
}
