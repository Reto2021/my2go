import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight } from 'lucide-react';

interface FeaturedSponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  level: string | null;
  engagement_area: string | null;
}

export function FeaturedSponsorsBar() {
  const [sponsors, setSponsors] = useState<FeaturedSponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedSponsors() {
      const { data, error } = await supabase
        .from('sponsors')
        .select('id, name, logo_url, website, level, engagement_area')
        .eq('is_active', true)
        .eq('featured_on_home', true)
        .eq('level', 'platinum')
        .order('sort_order', { ascending: true })
        .limit(6);

      if (!error && data) {
        setSponsors(data);
      }
      setIsLoading(false);
    }

    fetchFeaturedSponsors();
  }, []);

  if (isLoading || sponsors.length === 0) {
    return null;
  }

  return (
    <div className="py-4 px-2 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20 border-y border-amber-200/30 dark:border-amber-800/30">
      <div className="container">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Platinum Sponsoren
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <Link 
            to="/sponsoren" 
            className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
          >
            Alle Sponsoren
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-1">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.website || '#'}
              target={sponsor.website ? '_blank' : undefined}
              rel={sponsor.website ? 'noopener noreferrer' : undefined}
              className="flex-shrink-0 group"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-secondary/20 border border-amber-200/50 dark:border-amber-700/30 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-600 transition-all">
                {sponsor.logo_url ? (
                  <img 
                    src={sponsor.logo_url} 
                    alt={sponsor.name}
                    className="h-6 w-6 object-contain rounded"
                  />
                ) : (
                  <div className="h-6 w-6 rounded bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white text-xs font-bold">
                    {sponsor.name.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-medium text-secondary dark:text-foreground whitespace-nowrap group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  {sponsor.name}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
