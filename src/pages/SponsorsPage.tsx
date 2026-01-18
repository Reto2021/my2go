import { useEffect, useState } from 'react';
import { ExternalLink, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
}

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
        .select('id, name, logo_url, website')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSponsors(data || []);
    } catch (error) {
      console.error('Error loading sponsors:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
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

      {/* Sponsors Grid */}
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsors.map((sponsor) => (
            <Card key={sponsor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                {sponsor.logo_url ? (
                  <div className="w-24 h-24 mb-4 flex items-center justify-center">
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 mb-4 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-3xl font-bold text-muted-foreground">
                      {sponsor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <h3 className="font-semibold text-lg mb-2">{sponsor.name}</h3>
                
                {sponsor.website && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="mt-2 gap-2"
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
      )}

      {/* Footer CTA */}
      {sponsors.length > 0 && (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Möchtest du auch Sponsor werden?
          </p>
          <Button variant="outline" asChild>
            <a href="mailto:hello@my2go.ch">Kontaktiere uns</a>
          </Button>
        </div>
      )}
    </div>
  );
}
