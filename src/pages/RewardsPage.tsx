import { useEffect, useState } from 'react';
import { getRewards, Reward } from '@/lib/api';
import { useBrowseMode } from '@/lib/session';
import { RewardCard, RewardCardSkeleton } from '@/components/ui/reward-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { Gift, Wallet, Info } from 'lucide-react';

const categories = [
  { id: 'all', label: 'Alle' },
  { id: 'discount', label: 'Rabatte' },
  { id: 'product', label: 'Produkte' },
  { id: 'experience', label: 'Erlebnisse' },
  { id: 'exclusive', label: 'Exklusiv' },
];

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const isBrowseMode = useBrowseMode();
  
  const loadRewards = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const data = await getRewards(activeCategory);
      setRewards(data);
    } catch (err) {
      console.error('Failed to load rewards:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadRewards();
  }, [activeCategory]);
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <h1 className="text-display-sm mb-4">Rewards</h1>
          
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
                  activeCategory === cat.id
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      {/* Browse Mode Banner */}
      {isBrowseMode && (
        <div className="container pt-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 flex-shrink-0">
              <Info className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Zum Einlösen Karte öffnen
              </p>
              <p className="text-xs text-muted-foreground">
                Öffne deine 2Go Taler Karte, um Rewards einzulösen.
              </p>
            </div>
            <button 
              className="btn-primary py-2 px-4 text-sm flex-shrink-0"
              onClick={() => window.location.href = '/?token=demo'}
            >
              <Wallet className="h-4 w-4" />
              Öffnen
            </button>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="container py-6">
        {isLoading ? (
          <div className="space-y-3 stagger-children">
            {Array.from({ length: 5 }).map((_, i) => (
              <RewardCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState 
            title="Rewards konnten nicht geladen werden"
            onRetry={loadRewards}
          />
        ) : rewards.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="Keine Rewards gefunden"
            description="In dieser Kategorie sind aktuell keine Rewards verfügbar."
          />
        ) : (
          <div className="space-y-3 stagger-children">
            {rewards.map(reward => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
