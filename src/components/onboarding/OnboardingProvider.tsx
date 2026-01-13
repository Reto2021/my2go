import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface OnboardingStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
}

interface OnboardingContextValue {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: OnboardingStep | null;
  steps: OnboardingStep[];
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  hasCompletedOnboarding: boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    targetSelector: '[data-onboarding="radio-player"]',
    title: 'Willkommen bei My 2Go! 🎉',
    description: 'Starte hier den Radio-Stream und sammle 2Go Taler während du hörst. Je länger du hörst, desto mehr verdienst du!',
    position: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'balance',
    targetSelector: '[data-onboarding="balance-card"]',
    title: 'Dein Taler-Guthaben 💰',
    description: 'Hier siehst du dein aktuelles Guthaben. Sammle Taler durch Radio hören, Tages-Bonus und Aktionen!',
    position: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'streak',
    targetSelector: '[data-onboarding="streak-card"]',
    title: 'Täglicher Bonus 🔥',
    description: 'Hol dir jeden Tag deinen Bonus! Je länger deine Serie, desto mehr Taler bekommst du.',
    position: 'bottom',
    spotlightPadding: 8,
  },
  {
    id: 'quick-actions',
    targetSelector: '[data-onboarding="quick-actions"]',
    title: 'Schnellzugriff ⚡',
    description: 'Hier findest du alle wichtigen Funktionen auf einen Blick: Gutscheine, Partner, Einladungen und mehr.',
    position: 'top',
    spotlightPadding: 8,
  },
  {
    id: 'rewards',
    targetSelector: '[data-onboarding="rewards-section"]',
    title: 'Gutscheine einlösen 🎁',
    description: 'Tausche deine Taler gegen echte Rabatte und Vorteile bei lokalen Partnern ein!',
    position: 'top',
    spotlightPadding: 8,
  },
  {
    id: 'navigation',
    targetSelector: '[data-onboarding="bottom-nav"]',
    title: 'Navigation 🧭',
    description: 'Wechsle hier zwischen Home, Gutscheinen, deinem QR-Code, Partnern und Taler-Alarm.',
    position: 'top',
    spotlightPadding: 4,
  },
];

const STORAGE_KEY = 'my2go_onboarding_completed';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

  // Check if onboarding was completed
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    setHasCompletedOnboarding(completed === 'true');
  }, []);

  // Auto-start onboarding for new authenticated users
  useEffect(() => {
    if (user && !hasCompletedOnboarding) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, hasCompletedOnboarding]);

  const currentStep = isActive ? ONBOARDING_STEPS[currentStepIndex] : null;

  const startOnboarding = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const skipOnboarding = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasCompletedOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    setHasCompletedOnboarding(true);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep,
        steps: ONBOARDING_STEPS,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        hasCompletedOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
