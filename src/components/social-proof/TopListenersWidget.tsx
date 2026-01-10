import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, Crown, Medal, ChevronRight, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TopListenersWidgetProps {
  className?: string;
  maxItems?: number;
}

export function TopListenersWidget({ className, maxItems = 3 }: TopListenersWidgetProps) {
  const { leaderboard, isLoading } = useLeaderboard();

  const topListeners = leaderboard.slice(0, maxItems);

  if (isLoading) {
    return (
      <div className={cn('card-base p-4', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 h-20 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (topListeners.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('card-base overflow-hidden', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-accent/15">
            <Trophy className="h-4 w-4 text-accent" />
          </div>
          <span className="font-bold text-foreground">Top Hörer der Woche</span>
        </div>
        <Link to="/leaderboard" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          Alle <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Top 3 Podium Style */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-end justify-center gap-2">
          {/* Second Place */}
          {topListeners[1] && (
            <TopListenerCard 
              listener={topListeners[1]} 
              rank={2} 
              position="left"
            />
          )}
          
          {/* First Place - Taller */}
          {topListeners[0] && (
            <TopListenerCard 
              listener={topListeners[0]} 
              rank={1} 
              position="center"
            />
          )}
          
          {/* Third Place */}
          {topListeners[2] && (
            <TopListenerCard 
              listener={topListeners[2]} 
              rank={3} 
              position="right"
            />
          )}
        </div>
      </div>

      {/* Call to Action */}
      <Link 
        to="/leaderboard"
        className="flex items-center justify-center gap-2 py-3 bg-muted/50 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Headphones className="h-4 w-4" />
        Radio hören & aufsteigen
      </Link>
    </motion.div>
  );
}

interface TopListenerCardProps {
  listener: {
    rank: number;
    nickname: string;
    weekly_earned: number;
    avatar_url: string | null;
  };
  rank: 1 | 2 | 3;
  position: 'left' | 'center' | 'right';
}

function TopListenerCard({ listener, rank, position }: TopListenerCardProps) {
  const isFirst = rank === 1;
  
  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-3.5 w-3.5 text-gray-400" />;
      case 3:
        return <Medal className="h-3.5 w-3.5 text-amber-600" />;
    }
  };

  const getBgColor = () => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-b from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-b from-gray-400/15 to-gray-400/5 border-gray-400/20';
      case 3:
        return 'bg-gradient-to-b from-amber-600/15 to-amber-600/5 border-amber-600/20';
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position === 'center' ? 0 : 0.1 }}
      className={cn(
        'flex flex-col items-center p-3 rounded-xl border',
        getBgColor(),
        isFirst ? 'flex-1 max-w-[120px]' : 'flex-1 max-w-[100px]'
      )}
    >
      {/* Rank Badge */}
      <div className="flex items-center justify-center mb-2">
        {getRankIcon()}
      </div>

      {/* Avatar */}
      <Avatar className={cn(
        'border-2 mb-2',
        isFirst ? 'h-12 w-12' : 'h-10 w-10',
        rank === 1 && 'border-yellow-500/50',
        rank === 2 && 'border-gray-400/50',
        rank === 3 && 'border-amber-600/50'
      )}>
        <AvatarImage src={listener.avatar_url || undefined} />
        <AvatarFallback className={cn(
          'text-xs font-bold',
          rank === 1 && 'bg-yellow-500/20 text-yellow-700',
          rank === 2 && 'bg-gray-400/20 text-gray-600',
          rank === 3 && 'bg-amber-600/20 text-amber-700'
        )}>
          {getInitials(listener.nickname)}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <p className={cn(
        'font-semibold text-center truncate w-full',
        isFirst ? 'text-sm' : 'text-xs'
      )}>
        {listener.nickname}
      </p>

      {/* Taler earned */}
      <div className="flex items-center gap-1 mt-1">
        <span className={cn(
          'font-bold',
          isFirst ? 'text-sm text-yellow-600' : 'text-xs text-muted-foreground'
        )}>
          {listener.weekly_earned.toLocaleString('de-DE')}
        </span>
        <span className="text-[10px] text-muted-foreground">Taler</span>
      </div>
    </motion.div>
  );
}

// Compact version for smaller spaces
export function TopListenersCompact({ className }: { className?: string }) {
  const { leaderboard, isLoading } = useLeaderboard();
  const topThree = leaderboard.slice(0, 3);

  if (isLoading || topThree.length === 0) {
    return null;
  }

  return (
    <Link 
      to="/leaderboard"
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors',
        className
      )}
    >
      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-accent/15">
        <Trophy className="h-4 w-4 text-accent" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">Top Hörer diese Woche</p>
        <div className="flex items-center gap-2">
          {/* Stacked Avatars */}
          <div className="flex -space-x-2">
            {topThree.map((listener, index) => (
              <Avatar 
                key={listener.rank} 
                className={cn(
                  'h-6 w-6 border-2 border-background',
                  index === 0 && 'z-30',
                  index === 1 && 'z-20',
                  index === 2 && 'z-10'
                )}
              >
                <AvatarImage src={listener.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] font-bold bg-muted">
                  {listener.nickname.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-sm font-semibold truncate">
            {topThree[0].nickname}
          </span>
          <span className="text-xs text-muted-foreground">
            führt mit {topThree[0].weekly_earned} Talern
          </span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </Link>
  );
}
