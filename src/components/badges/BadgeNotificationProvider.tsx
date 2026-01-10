import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSafe } from "@/contexts/AuthContext";
import { BadgeNotification } from "./BadgeNotification";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  seen_at: string | null;
  badges: Badge;
}

export function BadgeNotificationProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthSafe();
  const user = auth?.user ?? null;
  const queryClient = useQueryClient();
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
  const [shownBadgeIds, setShownBadgeIds] = useState<Set<string>>(new Set());

  // Fetch user's unseen badges
  const { data: unseenBadges = [] } = useQuery({
    queryKey: ["unseen-badges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", user.id)
        .is("seen_at", null)
        .order("earned_at", { ascending: false });
      
      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!user,
    refetchInterval: 5000, // Check every 5 seconds for new badges
  });

  // Show the next unseen badge that hasn't been shown yet
  useEffect(() => {
    if (!currentBadge && unseenBadges.length > 0) {
      const nextBadge = unseenBadges.find(ub => !shownBadgeIds.has(ub.badge_id));
      if (nextBadge) {
        setCurrentBadge(nextBadge.badges);
        setShownBadgeIds(prev => new Set([...prev, nextBadge.badge_id]));
      }
    }
  }, [unseenBadges, currentBadge, shownBadgeIds]);

  // Mark badge as seen and close notification
  const handleClose = useCallback(async () => {
    if (currentBadge && user) {
      // Mark as seen in database
      await supabase
        .from("user_badges")
        .update({ seen_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("badge_id", currentBadge.id);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["unseen-badges"] });
      queryClient.invalidateQueries({ queryKey: ["user-badges"] });
      
      // Clear current badge to allow showing next one
      setCurrentBadge(null);
    }
  }, [currentBadge, user, queryClient]);

  return (
    <>
      {children}
      {currentBadge && (
        <BadgeNotification badge={currentBadge} onClose={handleClose} />
      )}
    </>
  );
}
