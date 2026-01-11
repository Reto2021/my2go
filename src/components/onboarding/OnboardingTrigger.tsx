import { HelpCircle } from 'lucide-react';
import { useOnboarding } from './OnboardingProvider';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * A button to restart the onboarding tutorial
 * Can be placed in settings or help sections
 */
export function OnboardingTrigger() {
  const { startOnboarding, hasCompletedOnboarding } = useOnboarding();

  if (!hasCompletedOnboarding) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startOnboarding}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Tutorial starten</span>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent>
        <p>App-Tour nochmal ansehen</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Compact icon-only trigger for headers/navigation
 */
export function OnboardingTriggerIcon() {
  const { startOnboarding, hasCompletedOnboarding } = useOnboarding();

  if (!hasCompletedOnboarding) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={startOnboarding}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Tutorial starten"
        >
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>App-Tour ansehen</p>
      </TooltipContent>
    </Tooltip>
  );
}
