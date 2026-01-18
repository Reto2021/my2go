import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Heart, Crown, Star, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

type SponsorLevel = 'platinum' | 'gold' | 'silver' | 'bronze';
type EngagementArea = 'reward' | 'radio' | 'event' | 'partner' | 'community';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  level: SponsorLevel;
  engagement_area: EngagementArea;
  description: string | null;
}

const levelConfig: Record<SponsorLevel, { 
  label: string; 
  color: string; 
  bgColor: string;
  logoSize: string;
  cardClass: string;
}> = {
  platinum: { 
    label: 'Platinum', 
    color: 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900',
    bgColor: 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-300 dark:border-slate-600',
    logoSize: 'w-32 h-32',
    cardClass: 'col-span-full sm:col-span-2 lg:col-span-3'
  },
  gold: { 
    label: 'Gold', 
    color: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900',
    bgColor: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-950 border-amber-300 dark:border-amber-700',
    logoSize: 'w-28 h-28',
    cardClass: 'sm:col-span-2 lg:col-span-1'
  },
  silver: { 
    label: 'Silber', 
    color: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800',
    bgColor: 'border-gray-300 dark:border-gray-600',
    logoSize: 'w-24 h-24',
    cardClass: ''
  },
  bronze: { 
    label: 'Bronze', 
    color: 'bg-gradient-to-r from-orange-300 to-orange-400 text-orange-900',
    bgColor: 'border-orange-200 dark:border-orange-800',
    logoSize: 'w-20 h-20',
    cardClass: ''
  },
};

const engagementConfig: Record<EngagementArea, { label: string; emoji: string }> = {
  reward: { label: 'Reward', emoji: '🎁' },
  radio: { label: 'Radio', emoji: '📻' },
  event: { label: 'Event', emoji: '🎉' },
  partner: { label: 'Partner', emoji: '🤝' },
  community: { label: 'Community', emoji: '💚' },
};

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSponsors();
  }, []);

  async function loadSponsors() {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('id, name, logo_url, website, level, engagement_area, description')
        .eq('is_active', true)
        .order('sort_order')
        .order('name');

      if (error) throw error;
      setSponsors((data as Sponsor[]) || []);
    } catch (error) {
      console.error('Error loading sponsors:', error);
    } finally {
      setLoading(false);
    }
  }

  // Group sponsors by level
  const groupedSponsors = sponsors.reduce((acc, sponsor) => {
    const level = sponsor.level || 'bronze';
    if (!acc[level]) acc[level] = [];
    acc[level].push(sponsor);
    return acc;
  }, {} as Record<SponsorLevel, Sponsor[]>);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Heart className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Unsere Sponsoren</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Dank unserer grosszügigen Sponsoren können wir tolle Rewards für unsere Community anbieten. 
          Herzlichen Dank für eure Unterstützung!
        </p>
      </div>

      {/* Sponsors by Level */}
      {sponsors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Noch keine Sponsoren</h3>
            <p className="text-muted-foreground">
              Interessiert an einer Partnerschaft? Kontaktiere uns!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {(['platinum', 'gold', 'silver', 'bronze'] as SponsorLevel[]).map(level => {
            const levelSponsors = groupedSponsors[level];
            if (!levelSponsors?.length) return null;
            
            const config = levelConfig[level];
            const LevelIcon = level === 'platinum' || level === 'gold' ? Crown : Star;
            
            return (
              <section key={level}>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Badge className={cn('text-sm py-1.5 px-4', config.color)}>
                    <LevelIcon className="h-4 w-4 mr-1.5" />
                    {config.label} Sponsoren
                  </Badge>
                </div>
                
                <div className={cn(
                  'grid gap-6',
                  level === 'platinum' ? 'grid-cols-1' :
                  level === 'gold' ? 'sm:grid-cols-2 lg:grid-cols-3' :
                  'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                )}>
                  {levelSponsors.map((sponsor) => (
                    <Card 
                      key={sponsor.id} 
                      className={cn(
                        'overflow-hidden hover:shadow-lg transition-all border-2',
                        config.bgColor,
                        config.cardClass
                      )}
                    >
                      <CardContent className={cn(
                        'flex flex-col items-center text-center',
                        level === 'platinum' ? 'p-8' : 'p-6'
                      )}>
                        {sponsor.logo_url ? (
                          <div className={cn('mb-4 flex items-center justify-center', config.logoSize)}>
                            <img
                              src={sponsor.logo_url}
                              alt={sponsor.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className={cn(
                            'mb-4 rounded-full bg-muted flex items-center justify-center',
                            config.logoSize
                          )}>
                            <span className={cn(
                              'font-bold text-muted-foreground',
                              level === 'platinum' ? 'text-4xl' : 
                              level === 'gold' ? 'text-3xl' : 'text-2xl'
                            )}>
                              {sponsor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        <h3 className={cn(
                          'font-semibold mb-2',
                          level === 'platinum' ? 'text-2xl' :
                          level === 'gold' ? 'text-xl' : 'text-lg'
                        )}>
                          {sponsor.name}
                        </h3>
                        
                        <Badge variant="outline" className="mb-3 text-xs">
                          {engagementConfig[sponsor.engagement_area]?.emoji}{' '}
                          {engagementConfig[sponsor.engagement_area]?.label}-Sponsor
                        </Badge>

                        {sponsor.description && (
                          <p className={cn(
                            'text-muted-foreground mb-4',
                            level === 'platinum' ? 'text-base max-w-lg' : 'text-sm line-clamp-2'
                          )}>
                            {sponsor.description}
                          </p>
                        )}
                        
                        {sponsor.website && (
                          <Button
                            variant={level === 'platinum' ? 'default' : 'outline'}
                            size={level === 'platinum' ? 'default' : 'sm'}
                            asChild
                            className="gap-2"
                          >
                            <a
                              href={sponsor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Website besuchen
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Footer CTA */}
      <div className="mt-16 text-center">
        <Card className="inline-block">
          <CardContent className="py-8 px-12">
            <h3 className="text-xl font-semibold mb-2">Werde Sponsor!</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Unterstütze unsere Community und profitiere von attraktiven Sponsoring-Paketen.
            </p>
            <Button asChild>
              <Link to="/go/sponsoring" className="inline-flex items-center gap-2">
                Zu den Sponsoring-Paketen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
