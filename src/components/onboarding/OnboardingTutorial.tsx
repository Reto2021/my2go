import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Gift, Ticket, ChevronRight, X } from 'lucide-react';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'onboarding_completed';

interface OnboardingStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'listen',
    icon: Radio,
    title: 'Hör Radio',
    description: 'Starte den Player – verdiene automatisch Taler beim Hören',
  },
  {
    id: 'earn',
    icon: TalerIcon,
    title: 'Sammle Taler',
    description: 'Radio hören, einkaufen, besuchen – überall Taler sammeln',
  },
  {
    id: 'redeem',
    icon: Gift,
    title: 'Geniess vor Ort',
    description: 'Tausche Taler gegen Gutscheine bei lokalen Partnern ein',
  },
];

export function OnboardingTutorial() {
  const { user, profile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    if (!user || !profile) return;
    
    // Check if onboarding was already completed
    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed) return;
    
    // Check if user is new (created within last 24 hours)
    const createdAt = new Date(profile.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation <= 24) {
      // Show after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, profile]);
  
  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };
  
  const handleSkip = () => {
    handleComplete();
  };
  
  if (!isVisible) return null;
  
  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm"
        >
          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute -top-12 right-0 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Überspringen
          </button>
          
          {/* Card */}
          <div className="card-base p-6 text-center">
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep 
                      ? 'w-8 bg-accent' 
                      : index < currentStep 
                        ? 'w-2 bg-accent/50' 
                        : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>
            
            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="h-20 w-20 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4"
                >
                  <StepIcon className="h-10 w-10 text-accent" />
                </motion.div>
                
                {/* Title */}
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {step.title}
                </h2>
                
                {/* Description */}
                <p className="text-muted-foreground mb-6">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>
            
            {/* Action button */}
            <button
              onClick={handleNext}
              className="btn-primary w-full group"
            >
              {isLastStep ? (
                <>
                  Los geht's!
                  <Gift className="h-4 w-4" />
                </>
              ) : (
                <>
                  Weiter
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
