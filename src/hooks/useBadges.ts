import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  criteria_type: string;
  criteria_value: number;
  sort_order: number;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  seen_at: string | null;
  badges: Badge;
}

export function useBadges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all badges
  const { data: allBadges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("sort_order");
      
      if (error) throw error;
      return data as Badge[];
    },
  });

  // Fetch user's earned badges
  const { data: userBadges = [], isLoading: loadingUserBadges } = useQuery({
    queryKey: ["user-badges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!user,
  });

  // Get unseen badges
  const unseenBadges = userBadges.filter(ub => !ub.seen_at);

  // Mark badge as seen
  const markAsSeen = useMutation({
    mutationFn: async (badgeId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("user_badges")
        .update({ seen_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("badge_id", badgeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-badges"] });
    },
  });

  // Get progress for each badge type
  const { data: progress } = useQuery({
    queryKey: ["badge-progress", user?.id],
    queryFn: async () => {
      if (!user) return { 
        lifetime_earned: 0, 
        redemption_count: 0, 
        referral_count: 0,
        streak_days: 0,
        leaderboard_rank: 999
      };
      
      // Get balance info
      const { data: balanceData } = await supabase
        .rpc("get_user_balance", { _user_id: user.id });
      
      // Get redemption count (used status only)
      const { count: redemptionCount } = await supabase
        .from("redemptions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "used");
      
      // Get profile data including streak and referrals
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_count, current_streak, longest_streak")
        .eq("id", user.id)
        .single();
      
      // Get leaderboard rank
      const { data: rankData } = await supabase
        .rpc("get_user_weekly_rank", { _user_id: user.id });
      
      return {
        lifetime_earned: balanceData?.[0]?.lifetime_earned || 0,
        redemption_count: redemptionCount || 0,
        referral_count: profile?.referral_count || 0,
        streak_days: Math.max(profile?.current_streak || 0, profile?.longest_streak || 0),
        leaderboard_rank: rankData?.[0]?.rank || 999,
      };
    },
    enabled: !!user,
  });

  // Helper to get progress for a specific badge
  const getProgressForBadge = (badge: Badge): number => {
    if (!progress) return 0;
    
    switch (badge.criteria_type) {
      case "lifetime_earned":
        return progress.lifetime_earned;
      case "redemption_count":
        return progress.redemption_count;
      case "referral_count":
        return progress.referral_count;
      case "streak_days":
        return progress.streak_days;
      case "leaderboard_rank":
        // For leaderboard, lower rank is better, so we show if user has achieved it
        // Return the criteria value if user's rank is <= required rank, else show current rank as "negative progress"
        return progress.leaderboard_rank <= badge.criteria_value ? badge.criteria_value : 0;
      default:
        return 0;
    }
  };

  // Check if user has earned a specific badge
  const hasBadge = (badgeSlug: string): boolean => {
    return userBadges.some(ub => ub.badges.slug === badgeSlug);
  };

  // Group badges by category
  const badgesByCategory = allBadges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  return {
    allBadges,
    userBadges,
    unseenBadges,
    badgesByCategory,
    progress,
    isLoading: loadingBadges || loadingUserBadges,
    markAsSeen: markAsSeen.mutate,
    getProgressForBadge,
    hasBadge,
  };
}
