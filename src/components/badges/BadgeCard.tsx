import { useState } from "react";
import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { BadgeIcon } from "./BadgeIcon";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ShareCardGenerator } from "@/components/share/ShareCardGenerator";

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
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  seen_at: string | null;
  badges: Badge;
}

interface BadgeCardProps {
  badge: Badge;
  userBadge?: UserBadge;
  progress?: number;
  showProgress?: boolean;
}

export function BadgeCard({ badge, userBadge, progress = 0, showProgress = true }: BadgeCardProps) {
  const earned = !!userBadge;
  const progressPercent = Math.min((progress / badge.criteria_value) * 100, 100);
  const [showShareCard, setShowShareCard] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative p-4 rounded-xl border transition-all ${
          earned 
            ? "bg-card border-primary/20 shadow-md" 
            : "bg-muted/30 border-border"
        }`}
      >
        {/* New badge indicator */}
        {userBadge && !userBadge.seen_at && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full"
          />
        )}

        {/* Share button for earned badges */}
        {earned && (
          <button
            onClick={() => setShowShareCard(true)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            title="Teilen"
          >
            <Share2 className="h-3.5 w-3.5 text-primary" />
          </button>
        )}

        <div className="flex items-start gap-3">
          <BadgeIcon 
            icon={badge.icon} 
            color={badge.color} 
            size="md"
            earned={earned}
          />
          
          <div className="flex-1 min-w-0 pr-6">
            <h3 className={`font-semibold ${earned ? "text-foreground" : "text-muted-foreground"}`}>
              {badge.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {badge.description}
            </p>
            
            {earned && userBadge && (
              <p className="text-xs text-primary mt-1">
                Erhalten am {format(new Date(userBadge.earned_at), "d. MMMM yyyy", { locale: de })}
              </p>
            )}
            
            {!earned && showProgress && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Fortschritt</span>
                  <span>{progress} / {badge.criteria_value}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: badge.color }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Share Card Modal */}
      <ShareCardGenerator
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        data={{
          type: 'badge',
          title: badge.name,
          subtitle: badge.description,
          icon: badge.icon,
        }}
      />
    </>
  );
}
