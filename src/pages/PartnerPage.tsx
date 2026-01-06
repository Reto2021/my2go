import { useEffect, useState } from 'react';
import { getPartners, Partner } from '@/lib/api';
import { PartnerCard, PartnerCardSkeleton } from '@/components/ui/partner-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { MapPin, LayoutList, Map } from 'lucide-react';

export default function PartnerPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const loadPartners = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const data = await getPartners();
      setPartners(data);
    } catch (err) {
      console.error('Failed to load partners:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadPartners();
  }, []);
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-display-sm">Partner</h1>
            
            {/* View Toggle */}
            <div className="flex bg-muted rounded-full p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                  viewMode === 'list'
                    ? 'bg-background shadow-soft text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <LayoutList className="h-4 w-4" />
                Liste
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                  viewMode === 'map'
                    ? 'bg-background shadow-soft text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Map className="h-4 w-4" />
                Karte
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Content */}
      {isLoading ? (
        <div className="container py-6 space-y-3 stagger-children">
          {Array.from({ length: 5 }).map((_, i) => (
            <PartnerCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="container py-6">
          <ErrorState 
            title="Partner konnten nicht geladen werden"
            onRetry={loadPartners}
          />
        </div>
      ) : partners.length === 0 ? (
        <div className="container py-6">
          <EmptyState
            icon={MapPin}
            title="Keine Partner gefunden"
            description="Aktuell sind keine Partner verfügbar."
          />
        </div>
      ) : viewMode === 'list' ? (
        <div className="container py-6 space-y-3 stagger-children">
          {partners.map(partner => (
            <PartnerCard key={partner.id} partner={partner} showArrow />
          ))}
        </div>
      ) : (
        <PartnerMapView partners={partners} />
      )}
    </div>
  );
}

interface PartnerMapViewProps {
  partners: Partner[];
}

function PartnerMapView({ partners }: PartnerMapViewProps) {
  return (
    <div className="relative h-[calc(100vh-180px)]">
      {/* Placeholder Map */}
      <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            <Map className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2 font-medium">
            Kartenansicht
          </p>
          <p className="text-sm text-muted-foreground">
            {partners.length} Partner in deiner Nähe
          </p>
        </div>
      </div>
      
      {/* Partner Pills */}
      <div className="absolute bottom-4 left-0 right-0 overflow-x-auto px-4">
        <div className="flex gap-3 scrollbar-none">
          {partners.map(partner => (
            <div 
              key={partner.id}
              className="shrink-0 card-base p-4 min-w-[200px] shadow-medium"
            >
              <p className="font-semibold text-sm truncate">{partner.name}</p>
              <p className="text-xs text-muted-foreground">{partner.category}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
