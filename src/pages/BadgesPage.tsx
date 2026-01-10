import { motion } from "framer-motion";
import { Award, Coins, Gift, Users, Trophy, Flame } from "lucide-react";
import { useBadges } from "@/hooks/useBadges";
import { BadgeCard } from "@/components/badges/BadgeCard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useIsAuthenticated } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const categoryInfo: Record<string, { title: string; icon: React.ElementType; description: string }> = {
  earning: {
    title: "Taler Sammeln",
    icon: Coins,
    description: "Sammle Taler und werde zum Meister!",
  },
  redemption: {
    title: "Einlösungen",
    icon: Gift,
    description: "Löse Gutscheine ein und spare!",
  },
  referral: {
    title: "Freunde werben",
    icon: Users,
    description: "Teile die App mit Freunden!",
  },
  leaderboard: {
    title: "Leaderboard",
    icon: Trophy,
    description: "Erreiche die Top-Platzierungen!",
  },
  streak: {
    title: "Login-Streak",
    icon: Flame,
    description: "Logge dich täglich ein!",
  },
};

export default function BadgesPage() {
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const { 
    badgesByCategory, 
    userBadges, 
    isLoading, 
    getProgressForBadge 
  } = useBadges();

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const earnedCount = userBadges.length;
  const totalCount = Object.values(badgesByCategory).flat().length;

  return (
    <div className="pb-24 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award size={32} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Meine Badges</h1>
        <p className="text-muted-foreground mt-1">
          {earnedCount} von {totalCount} Badges freigeschaltet
        </p>
        
        {/* Progress bar */}
        <div className="mt-4 max-w-xs mx-auto">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Badge categories */}
      <div className="space-y-8">
        {Object.entries(categoryInfo).map(([category, info], categoryIndex) => {
          const badges = badgesByCategory[category] || [];
          if (badges.length === 0) return null;

          const Icon = info.icon;

          return (
            <motion.section
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{info.title}</h2>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                </div>
              </div>

              <div className="grid gap-3">
                {badges.map((badge, index) => {
                  const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
                  
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                    >
                      <BadgeCard
                        badge={badge}
                        userBadge={userBadge}
                        progress={getProgressForBadge(badge)}
                        showProgress={!userBadge}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}
