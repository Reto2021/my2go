import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { useBadges } from "@/hooks/useBadges";
import { useNavigate } from "react-router-dom";

export function BadgeProgressRing() {
  const navigate = useNavigate();
  const { allBadges, userBadges, isLoading } = useBadges();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  const totalBadges = allBadges.length;
  const earnedBadges = userBadges.length;
  const remainingBadges = totalBadges - earnedBadges;
  const progressPercent = totalBadges > 0 ? (earnedBadges / totalBadges) * 100 : 0;

  // SVG circle properties
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Get the 3 most recent badges
  const recentBadges = userBadges
    .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())
    .slice(0, 3);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate("/badges")}
      className="w-full p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-card to-primary/5 border border-amber-500/20 hover:border-amber-500/40 transition-all text-left"
    >
      <div className="flex items-center gap-6">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/30"
            />
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#badgeGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            />
            <defs>
              <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EAB308" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.5 }}
              className="text-2xl font-bold text-foreground"
            >
              {earnedBadges}
            </motion.span>
            <span className="text-xs text-muted-foreground">von {totalBadges}</span>
          </div>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-foreground">Badge-Sammlung</h3>
          </div>
          
          {remainingBadges > 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch <span className="font-medium text-amber-500">{remainingBadges}</span> Badge{remainingBadges !== 1 ? 's' : ''} zum Freischalten!
            </p>
          ) : (
            <p className="text-sm text-amber-500 font-medium">
              🎉 Alle Badges freigeschaltet!
            </p>
          )}

          {/* Recent badges preview */}
          {recentBadges.length > 0 && (
            <div className="flex items-center gap-1 mt-3">
              {recentBadges.map((ub, index) => (
                <motion.div
                  key={ub.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                  style={{ backgroundColor: ub.badges.color }}
                  title={ub.badges.name}
                >
                  {ub.badges.name.charAt(0)}
                </motion.div>
              ))}
              {remainingBadges > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs"
                >
                  +{remainingBadges}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
