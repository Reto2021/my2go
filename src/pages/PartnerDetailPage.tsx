import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPartnerById, getPartnerRewards, Partner, Reward } from '@/lib/api';
import { RewardCard } from '@/components/ui/reward-card';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Gift, ExternalLink } from 'lucide-react';

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [partner, setPartner] = useState<Partner | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const loadPartner = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(false);
    try {
      const [partnerData, rewardsData] = await Promise.all([
        getPartnerById(id),
        getPartnerRewards(id),
      ]);
      setPartner(partnerData);
      setRewards(rewardsData);
    } catch (err) {
      console.error('Failed to load partner:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadPartner();
  }, [id]);
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (error || !partner) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <ErrorState 
          title="Partner nicht gefunden"
          onRetry={loadPartner}
        />
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold truncate">{partner.name}</h1>
        </div>
      </header>
      
      {/* Content */}
      <div className="container py-6">
        {/* Partner Header */}
        <div className="text-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary mx-auto mb-4">
            <MapPin className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-1">{partner.name}</h2>
          <span className="inline-block px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
            {partner.category}
          </span>
        </div>
        
        {/* Description */}
        <div className="card-elevated mb-6">
          <h3 className="font-semibold mb-2">Über uns</h3>
          <p className="text-muted-foreground">{partner.description}</p>
        </div>
        
        {/* Address */}
        <div className="card-elevated mb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Adresse</p>
              <p className="font-medium">{partner.address}</p>
            </div>
          </div>
        </div>
        
        {/* Rewards */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5 text-accent" />
            <h3 className="font-semibold">Rewards bei {partner.name}</h3>
          </div>
          
          {rewards.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Keine Rewards verfügbar"
              description="Dieser Partner hat aktuell keine Rewards."
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
    </div>
  );
}
