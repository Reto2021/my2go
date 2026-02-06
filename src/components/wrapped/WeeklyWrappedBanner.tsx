import { useState } from 'react';
import { BarChart3, ChevronRight } from 'lucide-react';
import { useWeeklyWrapped } from '@/hooks/useWeeklyWrapped';
import { WeeklyWrappedCard } from './WeeklyWrappedCard';
import { useAuthSafe } from '@/contexts/AuthContext';

export function WeeklyWrappedBanner() {
  const { data, isLoading } = useWeeklyWrapped();
  const auth = useAuthSafe();
  const [showCard, setShowCard] = useState(false);

  // Only show if user listened at least 5 minutes this week
  if (isLoading || !data || data.totalMinutes < 5) return null;

  const displayName = auth?.user?.user_metadata?.display_name || auth?.user?.email?.split('@')[0] || undefined;

  return (
    <>
      <button
        onClick={() => setShowCard(true)}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/20 flex items-center gap-3 group hover:border-accent/30 transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
          <BarChart3 className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-bold text-foreground">Dein Wochenrückblick</p>
          <p className="text-xs text-muted-foreground">
            {data.totalMinutes} min gehört · {data.talerEarned} Taler verdient
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
      </button>

      <WeeklyWrappedCard
        isOpen={showCard}
        onClose={() => setShowCard(false)}
        data={data}
        userName={displayName}
      />
    </>
  );
}
