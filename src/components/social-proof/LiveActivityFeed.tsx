import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLiveActivityFeed, ActivityItem } from '@/hooks/useLiveActivityFeed';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface LiveActivityFeedProps {
  className?: string;
  maxItems?: number;
}

export function LiveActivityFeed({ className, maxItems = 4 }: LiveActivityFeedProps) {
  const { activities, isConnected } = useLiveActivityFeed(maxItems);

  if (!isConnected || activities.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Live Aktivität
        </span>
      </div>

      {/* Activity Items */}
      <div className="space-y-2 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {activities.map((activity, index) => (
            <ActivityCard key={activity.id} activity={activity} index={index} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ActivityCard({ activity, index }: { activity: ActivityItem; index: number }) {
  const timeAgo = formatDistanceToNow(activity.timestamp, { 
    addSuffix: true, 
    locale: de 
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        layout: { duration: 0.2 }
      }}
      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50"
    >
      {/* Icon */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="text-lg flex-shrink-0"
      >
        {activity.icon}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">
          {activity.message}
        </p>
        <p className="text-xs text-muted-foreground">
          {timeAgo}
        </p>
      </div>

      {/* Amount if applicable */}
      {activity.amount && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold"
        >
          +{activity.amount}
        </motion.div>
      )}
    </motion.div>
  );
}

// Compact ticker version for inline display
export function ActivityTicker({ className }: { className?: string }) {
  const { activities } = useLiveActivityFeed(1);
  const latestActivity = activities[0];

  if (!latestActivity) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={latestActivity.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'flex items-center gap-2 text-xs text-muted-foreground',
          className
        )}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
        </span>
        <span>{latestActivity.icon}</span>
        <span className="truncate">{latestActivity.message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
