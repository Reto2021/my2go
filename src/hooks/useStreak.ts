import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StreakStatus {
  current_streak: number;
  longest_streak: number;
  can_claim: boolean;
  streak_active: boolean;
  next_bonus: number;
  last_claim_date: string | null;
}

interface ClaimResult {
  success: boolean;
  already_claimed: boolean;
  current_streak: number;
  longest_streak?: number;
  bonus: number;
  message: string;
}

export function useStreak() {
  const { user, refreshBalance } = useAuth();
  const queryClient = useQueryClient();

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
        queryClient.invalidateQueries({ queryKey: ["streak-status"] });
        queryClient.invalidateQueries({ queryKey: ["user-badges"] });
        queryClient.invalidateQueries({ queryKey: ["unseen-badges"] });
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
  };
}
