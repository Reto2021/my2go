import { useEffect, useState } from 'react';
import { getRewards, Reward } from '@/lib/api';
import { RewardCard } from '@/components/ui/reward-card';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { Gift } from 'lucide-react';

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
    <div className="animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <h1 className="text-xl font-bold mb-4">Rewards</h1>
          
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="container py-4">
        {isLoading ? (
          <PageLoader />
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
          <div className="space-y-3">
            {rewards.map(reward => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
