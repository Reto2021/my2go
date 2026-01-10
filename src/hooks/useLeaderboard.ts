import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardEntry {
  rank: number;
  nickname: string;
  weekly_earned: number;
  avatar_url: string | null;
}

interface UserRank {
  rank: number | null;
  weekly_earned: number;
  is_participating: boolean;
}

export function useLeaderboard() {
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch weekly leaderboard
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_weekly_leaderboard", { _limit: 10 });
      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user's rank
  const { data: userRank, isLoading: loadingUserRank } = useQuery({
    queryKey: ["user-rank", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.rpc("get_user_weekly_rank", { _user_id: user.id });
      if (error) throw error;
      return data?.[0] as UserRank | undefined;
    },
    enabled: !!user,
  });

  // Update leaderboard settings
  const updateSettings = useMutation({
    mutationFn: async ({ nickname, showOnLeaderboard }: { nickname: string; showOnLeaderboard: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("profiles")
        .update({
          leaderboard_nickname: nickname || null,
          show_on_leaderboard: showOnLeaderboard,
        })
        .eq("id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["user-rank"] });
      refreshProfile();
    },
  });

  return {
    leaderboard,
    userRank,
    isLoading: loadingLeaderboard || loadingUserRank,
    currentNickname: (profile as any)?.leaderboard_nickname || "",
    isParticipating: (profile as any)?.show_on_leaderboard || false,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}
