import { ReactNode, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { RadioHeader } from '@/components/ui/radio-header';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { BadgeNotificationProvider } from '@/components/badges/BadgeNotificationProvider';
import { SessionSummarySheet } from '@/components/ui/session-summary-sheet';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { RadioPlayerBar } from '@/components/radio/RadioPlayerBar';
import { ExpandedRadioPlayer } from '@/components/ui/radio-player-expanded';
import { TierCelebration } from '@/components/radio/TierCelebration';
import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';
import { StreakDetailsSheet } from '@/components/streak/StreakDetailsSheet';
import { useRadioRewards } from '@/hooks/useRadioRewards';
import { useTierReachedNotification } from '@/hooks/useTierReachedNotification';
import { useRadioStore } from '@/lib/radio-store';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Track radio listening for rewards
  const { sessionSummary, showSummary, closeSummary } = useRadioRewards();
  const { isPlayerExpanded, setPlayerExpanded } = useRadioStore();
  const [showStreakDetails, setShowStreakDetails] = useState(false);
  
  // Tier reached celebration
  const { showCelebration, currentTierReward, dismissCelebration } = useTierReachedNotification();
  
  return (
    <BadgeNotificationProvider>
      <div className="min-h-screen bg-background">
        <OfflineIndicator />
        <RadioHeader />
        <main className="pt-20 pb-40">
          {children || <Outlet />}
        </main>
        <BottomNav />
        
        {/* Unified Radio Player Bar - Slider + Mini Player */}
        <RadioPlayerBar 
          onExpand={() => setPlayerExpanded(true)} 
          onStreakDetailsOpen={() => setShowStreakDetails(true)}
        />
        
        {/* Expanded Player Bottom Sheet */}
        <ExpandedRadioPlayer 
          isOpen={isPlayerExpanded} 
          onClose={() => setPlayerExpanded(false)} 
        />
        
        {/* Tier Reached Celebration */}
        <TierCelebration
          isVisible={showCelebration}
          talerAmount={currentTierReward}
          onDismiss={dismissCelebration}
        />
        
        {/* Streak Details Sheet */}
        <StreakDetailsSheet 
          open={showStreakDetails} 
          onOpenChange={setShowStreakDetails} 
        />
        
        {/* Onboarding Tutorial for new users */}
        <OnboardingTutorial />
        
        <WhatsAppButton />
        
        {/* Session Summary Modal with Share Option */}
        <SessionSummarySheet
          isOpen={showSummary}
          onClose={closeSummary}
          sessionData={sessionSummary}
        />
      </div>
    </BadgeNotificationProvider>
  );
}
