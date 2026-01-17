import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, MapPin } from 'lucide-react';
import { useNewPartners } from '@/hooks/useNewPartners';
import { cn } from '@/lib/utils';

export function NewPartnerBanner() {
  const { newPartners, hasNewPartners, dismissAlert, dismissAll } = useNewPartners();

  if (!hasNewPartners || newPartners.length === 0) {
    return null;
  }

  const partner = newPartners[0];
  const remainingCount = newPartners.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className="overflow-hidden"
      >
        <div className="relative rounded-xl bg-gradient-to-r from-accent/20 via-accent/10 to-primary/10 border border-accent/30 p-4">
          {/* Sparkle decoration */}
          <div className="absolute top-2 right-12 opacity-60">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
          </div>
          
          {/* Dismiss button */}
          <button
            onClick={() => dismissAlert(partner.id)}
            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="Schliessen"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-3">
            {/* Partner Logo */}
            <div className="shrink-0">
              {partner.partner?.logo_url ? (
                <img
                  src={partner.partner.logo_url}
                  alt={partner.partner.name}
                  className="w-12 h-12 rounded-xl object-cover bg-background"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-semibold">
                  <Sparkles className="h-3 w-3" />
                  Neu in deiner Nähe
                </span>
              </div>
              
              <p className="font-semibold text-foreground truncate">
                {partner.partner?.name || 'Neuer Partner'}
              </p>
              
              {partner.partner?.city && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {partner.partner.city}
                  {partner.partner.category && ` • ${partner.partner.category}`}
                </p>
              )}
            </div>

            {/* CTA */}
            <Link
              to={`/partner/${partner.partner?.slug || partner.partner_id}`}
              className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>

          {/* More partners indicator */}
          {remainingCount > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-accent/20"
            >
              <button
                onClick={dismissAll}
                className="w-full flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">
                  +{remainingCount} weitere neue Partner
                </span>
                <span className="text-accent font-medium hover:underline">
                  Alle anzeigen →
                </span>
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Badge component for use elsewhere (e.g., in navigation)
export function NewPartnerBadge({ className }: { className?: string }) {
  const { hasNewPartners, newPartners } = useNewPartners();

  if (!hasNewPartners) return null;

  return (
    <span 
      className={cn(
        "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold",
        className
      )}
    >
      {newPartners.length}
    </span>
  );
}
