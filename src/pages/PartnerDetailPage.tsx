import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPartnerBySlug, getPartnerById, getRewardsByPartner, Partner, Reward } from '@/lib/supabase-helpers';
import { RewardCard } from '@/components/ui/reward-card';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { GoogleReviewCard } from '@/components/partner/GoogleReviewBadge';
import { TestimonialCarousel } from '@/components/partner/TestimonialCarousel';
import { RedemptionCountBadge } from '@/components/social-proof/RedemptionCountBadge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useQRScanTracking } from '@/hooks/useQRScanTracking';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  MapPin, 
  Gift, 
  Clock, 
  Phone, 
  Globe, 
  Navigation,
  ExternalLink,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [partner, setPartner] = useState<Partner | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Track QR scans when page is visited with UTM params
  useQRScanTracking(partner?.id);
  const loadPartner = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(false);
    try {
      // Try to load by slug first, then by id
      let partnerData = await getPartnerBySlug(id);
      if (!partnerData) {
        partnerData = await getPartnerById(id);
      }
      
      if (partnerData) {
        const rewardsData = await getRewardsByPartner(partnerData.id);
        setPartner(partnerData);
        setRewards(rewardsData);
      } else {
        setError(true);
      }
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
  
  // Build address string from components
  const getAddress = () => {
    if (!partner) return '';
    const parts = [
      [partner.address_street, partner.address_number].filter(Boolean).join(' '),
      [partner.postal_code, partner.city].filter(Boolean).join(' '),
    ].filter(Boolean);
    return parts.join(', ');
  };
  
  // Navigate to partner and award Taler
  const navigateToPartner = useCallback(async () => {
    if (!partner) return;
    const query = encodeURIComponent(getAddress());
    
    // Detect iOS for Apple Maps, otherwise Google Maps
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const mapsUrl = isIOS
      ? `maps://maps.apple.com/?q=${query}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;

    // Open maps
    window.open(mapsUrl, '_blank');

    // Award navigation Taler if logged in
    if (user) {
      try {
        const { data, error } = await supabase.rpc('award_navigation_taler', {
          _user_id: user.id,
          _partner_id: partner.id,
        });
        if (data && typeof data === 'object' && 'success' in data) {
          const result = data as { success: boolean; taler_awarded?: number; already_awarded?: boolean; message?: string };
          if (result.success) {
            toast.success('+3 Taler', {
              description: 'Navigations-Bonus erhalten!',
              icon: '🧭',
            });
          }
          // Silently skip if already_awarded today
        }
      } catch (err) {
        // Don't block navigation if Taler award fails
        console.error('Navigation taler award failed:', err);
      }
    }
  }, [partner, user]);
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (error || !partner) {
    return (
      <div className="min-h-screen pb-24">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="container py-4 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">Partner</h1>
          </div>
        </header>
        <div className="container py-8">
          <ErrorState title="Partner nicht gefunden" onRetry={loadPartner} />
        </div>
      </div>
    );
  }
  
  const address = getAddress();
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold truncate">{partner.name}</h1>
        </div>
      </header>
      
      {/* Content */}
      <div className="container py-6 animate-in">
        {/* Partner Header */}
        <div className="text-center mb-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/20 mx-auto mb-4 overflow-hidden">
              {partner.logo_url ? (
                <OptimizedImage 
                  src={partner.logo_url} 
                  alt={partner.name} 
                  width={80}
                  height={80}
                  className="h-full w-full rounded-3xl"
                />
              ) : (
                <Store className="h-10 w-10 text-secondary" />
              )}
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">{partner.name}</h2>
          
          {/* Social Proof - Redemption Count */}
          <div className="flex justify-center mb-3">
            <RedemptionCountBadge partnerId={partner.id} variant="prominent" />
          </div>
          
          <span className="badge-primary">
            {partner.category || 'Partner'}
          </span>
          {partner.is_featured && (
            <span className="ml-2 badge-accent">Featured</span>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            onClick={navigateToPartner}
            className="card-interactive p-4 flex flex-col items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Navigation className="h-5 w-5 text-accent" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">Route</span>
              {user && (
                <span className="text-2xs text-accent font-bold flex items-center gap-0.5">
                  +3 <TalerIcon size={10} className="text-accent" />
                </span>
              )}
            </div>
          </button>
          
          {rewards.length > 0 && (
            <Link 
              to="#rewards"
              className="card-interactive p-4 flex flex-col items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('rewards')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <Gift className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm font-semibold">{rewards.length} Rewards</span>
            </Link>
          )}
        </div>
        
        {/* Google Reviews Summary */}
        {partner.google_rating && (
          <GoogleReviewCard
            rating={partner.google_rating}
            reviewCount={partner.google_review_count}
            googlePlaceId={partner.google_place_id}
            className="mb-4"
          />
        )}
        
        {/* Testimonial Carousel - 4-5 Star Reviews */}
        <TestimonialCarousel 
          partnerId={partner.id} 
          minRating={4}
          className="mb-6"
        />
        
        {/* Address */}
        {address && (
          <div className="card-base p-4 mb-4">
            <button 
              onClick={navigateToPartner}
              className="flex items-start gap-4 w-full text-left group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 flex-shrink-0">
                <MapPin className="h-6 w-6 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">Adresse</p>
                <p className="font-semibold group-hover:text-secondary transition-colors">
                  {address}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
            </button>
          </div>
        )}
        
        {/* Description */}
        {partner.description && (
          <div className="card-base p-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted flex-shrink-0">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Beschreibung</p>
                <p className="font-medium">{partner.description}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* City Badge */}
        {partner.city && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 mb-6">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Region <span className="font-semibold text-foreground">{partner.city}</span>
            </span>
          </div>
        )}
        
        {/* Rewards Section */}
        <div id="rewards" className="pt-2">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-bold">Rewards</h3>
          </div>
          
          {rewards.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Keine Rewards verfügbar"
              description="Dieser Partner hat aktuell keine Rewards."
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
    </div>
  );
}
