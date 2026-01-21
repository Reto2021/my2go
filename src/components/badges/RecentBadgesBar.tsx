import { motion } from "framer-motion";
import { Award, ChevronRight } from "lucide-react";
import { useBadges } from "@/hooks/useBadges";
import { BadgeIcon } from "./BadgeIcon";
import { useNavigate } from "react-router-dom";

export function RecentBadgesBar() {
  const navigate = useNavigate();
  const { userBadges, allBadges, isLoading } = useBadges();

  if (isLoading || userBadges.length === 0) {
    return null;
  }

  // Get the 3 most recent badges
  const recentBadges = userBadges
    .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
    .slice(0, 3);

  const remainingCount = allBadges.length - userBadges.length;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate("/badges")}
      className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-transparent to-primary/5 border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        {/* Badge icons */}
        <div className="flex items-center -space-x-2">
          {recentBadges.map((ub, index) => (
            <motion.div
              key={ub.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
              style={{ zIndex: 3 - index }}
            >
              <BadgeIcon 
                icon={ub.badges.icon} 
                color={ub.badges.color} 
                size="sm" 
                earned 
              />
            </motion.div>
          ))}
        </div>

        {/* Text */}
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-foreground">
              {userBadges.length} {userBadges.length === 1 ? 'Auszeichnung' : 'Auszeichnungen'}
            </span>
          </div>
          {remainingCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Noch {remainingCount} zum Freischalten
            </p>
          )}
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </motion.button>
  );
}
