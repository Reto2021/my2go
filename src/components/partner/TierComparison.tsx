import { PARTNER_TIERS, TIER_FEATURES, PartnerTier } from '@/lib/partner-tiers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TierComparisonProps {
  onSelectTier?: (tier: PartnerTier) => void;
  selectedTier?: PartnerTier;
  showCTA?: boolean;
}

export function TierComparison({ onSelectTier, selectedTier, showCTA = true }: TierComparisonProps) {
  const tiers = Object.values(PARTNER_TIERS);

  return (
    <div className="space-y-6">
      {/* Tier Cards */}
      <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={cn(
                "relative overflow-hidden transition-all duration-300",
                tier.highlighted && "border-primary shadow-lg shadow-primary/10",
                selectedTier === tier.id && "ring-2 ring-primary"
              )}
            >
              {tier.highlighted && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-bl-lg">
                  Beliebt
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {tier.id === 'partner' ? (
                    <Crown className="h-5 w-5 text-primary" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  )}
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">{tier.tagline}</p>
                
                {/* Pricing */}
                <div className="mt-4">
                  {tier.monthlyPrice === 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">Gratis</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">CHF {tier.monthlyPrice}</span>
                      <span className="text-muted-foreground">/Monat</span>
                    </div>
                  )}
                  {tier.activationFee > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      + einmalig CHF {tier.activationFee} Aktivierung
                    </p>
                  )}
                  {tier.yearlyDiscount && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {tier.yearlyDiscount} sparen bei Jahresabo
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Feature List */}
                <ul className="space-y-2.5">
                  {TIER_FEATURES.slice(0, 8).map((feature) => {
                    const value = tier.id === 'starter' ? feature.starter : feature.partner;
                    const isIncluded = value === true || (typeof value === 'string' && value !== 'Sichtbar');
                    const displayValue = typeof value === 'string' ? value : null;

                    return (
                      <li key={feature.name} className="flex items-start gap-2.5 text-sm">
                        {isIncluded ? (
                          <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <span className={cn(!isIncluded && "text-muted-foreground/60")}>
                          {feature.name}
                          {displayValue && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({displayValue})
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                
                {/* CTA */}
                {showCTA && (
                  <div className="mt-6">
                    <Button 
                      onClick={() => onSelectTier?.(tier.id)}
                      className={cn(
                        "w-full gap-2",
                        tier.highlighted 
                          ? "bg-primary hover:bg-primary/90" 
                          : "bg-muted text-foreground hover:bg-muted/80"
                      )}
                      variant={tier.highlighted ? "default" : "secondary"}
                    >
                      {tier.id === 'starter' ? 'Kostenlos starten' : 'Jetzt upgraden'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Full Feature Comparison Table (Desktop) */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alle Features im Vergleich</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Feature</th>
                    <th className="text-center py-3 px-4 font-medium">Starter</th>
                    <th className="text-center py-3 px-4 font-medium text-primary">Partner</th>
                  </tr>
                </thead>
                <tbody>
                  {TIER_FEATURES.map((feature) => (
                    <tr key={feature.name} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-medium">{feature.name}</span>
                          {feature.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {feature.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <FeatureValue value={feature.starter} />
                      </td>
                      <td className="text-center py-3 px-4">
                        <FeatureValue value={feature.partner} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="h-4 w-4 text-green-500 mx-auto" />;
  }
  if (value === false) {
    return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  }
  return <span className="text-sm font-medium">{value}</span>;
}
