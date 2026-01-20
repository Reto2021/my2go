import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Gift, 
  Percent, 
  Coffee,
  Star,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QuizAnswers } from '@/lib/partner-quiz-calculations';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface RewardSuggestion {
  title: string;
  description: string;
  reward_type: 'fixed_discount' | 'percent_discount' | 'free_item' | 'experience';
  taler_cost: number;
  value_amount?: number;
  value_percent?: number;
  terms: string;
}

interface AIRewardSuggestionsProps {
  answers: QuizAnswers;
}

const rewardTypeIcons: Record<string, typeof Gift> = {
  fixed_discount: Gift,
  percent_discount: Percent,
  free_item: Coffee,
  experience: Star,
};

const rewardTypeLabels: Record<string, string> = {
  fixed_discount: 'Rabatt',
  percent_discount: 'Prozent',
  free_item: 'Gratis',
  experience: 'Erlebnis',
};

export function AIRewardSuggestions({ answers }: AIRewardSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<RewardSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const loadSuggestions = async () => {
    if (!answers.companyName) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Map businessType to a more descriptive category for AI
    const categoryMap: Record<string, string> = {
      'walk-in': 'Einzelhandel / Gastronomie',
      'termin': 'Dienstleistung mit Terminbuchung',
      'mischform': 'Mischbetrieb (Walk-in + Termine)',
      'b2b': 'B2B Dienstleister'
    };
    const category = answers.businessType ? categoryMap[answers.businessType] || 'Lokales Gewerbe' : 'Lokales Gewerbe';

    try {
      const { data, error: fnError } = await supabase.functions.invoke('suggest-rewards', {
        body: {
          partnerName: answers.companyName,
          category: category,
          description: answers.employees ? `${answers.employees} Mitarbeiter, ${answers.locations || '1'} Standort(e)` : undefined
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.rewards) {
        setSuggestions(data.rewards);
        setHasLoaded(true);
      } else {
        throw new Error(data?.error || 'Keine Vorschläge erhalten');
      }
    } catch (err) {
      console.error('Error loading reward suggestions:', err);
      setError('Vorschläge konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load on mount if company name is set
  useEffect(() => {
    if (answers.companyName && !hasLoaded && !isLoading) {
      loadSuggestions();
    }
  }, [answers.companyName]);

  // Don't show if no company name
  if (!answers.companyName) {
    return null;
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="overflow-hidden print-hide">
        <CollapsibleTrigger className="w-full">
          <div className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-foreground">Deine Reward-Ideen</h4>
                <p className="text-sm text-muted-foreground">
                  KI-generiert für {answers.companyName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasLoaded && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadSuggestions();
                  }}
                  disabled={isLoading}
                  className="h-8 w-8"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </Button>
              )}
              {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4">
            {isLoading && !hasLoaded && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <p className="text-sm text-muted-foreground">Generiere passende Reward-Ideen...</p>
              </div>
            )}

            {error && !isLoading && (
              <div className="text-center py-6">
                <p className="text-sm text-destructive mb-3">{error}</p>
                <Button variant="outline" size="sm" onClick={loadSuggestions}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Erneut versuchen
                </Button>
              </div>
            )}

            {!isLoading && !error && suggestions.length > 0 && (
              <div className="space-y-3">
                <AnimatePresence>
                  {suggestions.map((reward, index) => {
                    const Icon = rewardTypeIcons[reward.reward_type] || Gift;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-muted/50 border border-border hover:border-accent/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            reward.reward_type === 'fixed_discount' && "bg-green-500/15 text-green-600",
                            reward.reward_type === 'percent_discount' && "bg-blue-500/15 text-blue-600",
                            reward.reward_type === 'free_item' && "bg-amber-500/15 text-amber-600",
                            reward.reward_type === 'experience' && "bg-purple-500/15 text-purple-600"
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-semibold text-foreground">{reward.title}</h5>
                              <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full shrink-0">
                                {reward.taler_cost} Taler
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                            {reward.terms && (
                              <p className="text-xs text-muted-foreground/70 mt-2 italic">{reward.terms}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  Diese Vorschläge kannst du nach dem Onboarding anpassen
                </p>
              </div>
            )}

            {!isLoading && !error && suggestions.length === 0 && !hasLoaded && (
              <div className="text-center py-6">
                <Button variant="outline" onClick={loadSuggestions}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Reward-Ideen generieren
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
