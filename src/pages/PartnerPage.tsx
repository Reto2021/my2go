import { useEffect, useState } from 'react';
import { getPartners, Partner } from '@/lib/api';
import { PartnerCard } from '@/components/ui/partner-card';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { MapPin, List, Map } from 'lucide-react';

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
    <div className="animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Partner</h1>
            
            {/* View Toggle */}
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  viewMode === 'list'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <List className="h-4 w-4" />
                Liste
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  viewMode === 'map'
                    ? 'bg-card shadow-sm text-foreground'
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
        <PageLoader />
      ) : error ? (
        <div className="container py-4">
          <ErrorState 
            title="Partner konnten nicht geladen werden"
            onRetry={loadPartners}
          />
        </div>
      ) : partners.length === 0 ? (
        <div className="container py-4">
          <EmptyState
            icon={MapPin}
            title="Keine Partner gefunden"
            description="Aktuell sind keine Partner verfügbar."
          />
        </div>
      ) : viewMode === 'list' ? (
        <div className="container py-4 space-y-3">
          {partners.map(partner => (
            <PartnerCard key={partner.id} partner={partner} />
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
      <div className="absolute inset-0 bg-secondary flex items-center justify-center">
        <div className="text-center p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            <Map className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-2">
            Kartenansicht
          </p>
          <p className="text-sm text-muted-foreground">
            {partners.length} Partner in deiner Nähe
          </p>
        </div>
      </div>
      
      {/* Partner Pills */}
      <div className="absolute bottom-4 left-4 right-4 overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {partners.map(partner => (
            <div 
              key={partner.id}
              className="shrink-0 card-elevated p-3 min-w-[200px]"
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
