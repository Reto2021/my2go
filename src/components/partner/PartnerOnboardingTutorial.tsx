import { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  BarChart3, 
  QrCode, 
  Gift, 
  Star, 
  MessageSquare,
  Settings,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  details?: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Willkommen im Partner-Portal!',
    description: 'Hier verwaltest du dein Geschäft, Rewards und Kundenfeedback. Lass uns kurz die wichtigsten Funktionen durchgehen.',
    icon: Sparkles,
    color: 'text-accent',
    bgColor: 'bg-accent/20',
  },
  {
    id: 'dashboard',
    title: 'Dashboard & Statistiken',
    description: 'Das Dashboard zeigt dir alle wichtigen KPIs auf einen Blick.',
    icon: BarChart3,
    color: 'text-accent',
    bgColor: 'bg-accent/20',
    details: [
      'Offene vs. eingelöste Rewards',
      'Taler-Umsatz über Zeit',
      'Kundenbewertungen & Trends',
      '14-Tage Aktivitätsübersicht'
    ]
  },
  {
    id: 'rewards',
    title: 'Rewards verwalten',
    description: 'Erstelle attraktive Angebote für deine Kunden.',
    icon: Gift,
    color: 'text-accent',
    bgColor: 'bg-accent/20',
    details: [
      'Rabatte in € oder %',
      'Gratis-Artikel oder Erlebnisse',
      'Taler-Kosten selbst festlegen',
      'Verfügbarkeit & Gültigkeit'
    ]
  },
  {
    id: 'redemptions',
    title: 'Einlösungen bestätigen',
    description: 'Wenn Kunden einen Reward einlösen, kannst du ihn hier scannen oder manuell bestätigen.',
    icon: QrCode,
    color: 'text-success',
    bgColor: 'bg-success/20',
    details: [
      'QR-Code scannen oder Code eingeben',
      'Einlösung bestätigen oder stornieren',
      'Automatische Taler-Abbuchung'
    ]
  },
  {
    id: 'reviews',
    title: 'Review-Anfragen',
    description: 'Nach jeder Einlösung können Kunden dich bewerten. So sammelst du wertvolles Feedback!',
    icon: Star,
    color: 'text-warning',
    bgColor: 'bg-warning/20',
    details: [
      'Automatische Anfrage nach Einlösung',
      'In-App Bewertung (1-5 Sterne)',
      'Weiterleitung zu Google Reviews',
      'Feedback-Texte einsehen'
    ]
  },
  {
    id: 'review-setup',
    title: 'Review-Setup konfigurieren',
    description: 'Aktiviere automatische Review-Anfragen für mehr Google-Bewertungen.',
    icon: MessageSquare,
    color: 'text-accent',
    bgColor: 'bg-accent/20',
    details: [
      'Google Business Profil verknüpfen',
      'Verzögerung nach Einlösung einstellen',
      'Nur bei positiver In-App Bewertung',
      'Bonus-Taler für Bewertungen'
    ]
  },
  {
    id: 'done',
    title: 'Bereit zum Start!',
    description: 'Du kennst jetzt alle wichtigen Funktionen. Bei Fragen sind wir für dich da!',
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success/20',
  },
];

interface PartnerOnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function PartnerOnboardingTutorial({ isOpen, onClose, onComplete }: PartnerOnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const step = onboardingSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden border"
      >
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Close button */}
        <button 
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="p-6 pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Icon */}
              <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mx-auto', step.bgColor)}>
                <step.icon className={cn('h-8 w-8', step.color)} />
              </div>

              {/* Title & Description */}
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold">{step.title}</h2>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>

              {/* Details */}
              {step.details && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  {step.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Step indicator */}
              <div className="flex justify-center gap-1.5 pt-2">
                {onboardingSteps.map((_, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      idx === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="p-6 pt-0 flex gap-3">
          {!isFirstStep && (
            <Button 
              variant="outline" 
              onClick={handlePrev}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
          )}
          
          <Button 
            onClick={handleNext}
            className={cn("flex-1", isFirstStep && "w-full")}
          >
            {isLastStep ? 'Los geht\'s!' : 'Weiter'}
            {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
