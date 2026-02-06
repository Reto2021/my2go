import { ReactNode, useState, lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { RadioHeader } from '@/components/ui/radio-header';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { BadgeNotificationProvider } from '@/components/badges/BadgeNotificationProvider';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { RadioPlayerBar } from '@/components/radio/RadioPlayerBar';
import { useRadioRewards } from '@/hooks/useRadioRewards';
import { useTierReachedNotification } from '@/hooks/useTierReachedNotification';
import { useRadioStore } from '@/lib/radio-store';
import { useMilestoneStore } from '@/lib/milestone-store';

// Lazy load heavy components that aren't needed immediately
const ExpandedRadioPlayer = lazy(() => import('@/components/ui/radio-player-expanded').then(m => ({ default: m.ExpandedRadioPlayer })));
const TierCelebration = lazy(() => import('@/components/radio/TierCelebration').then(m => ({ default: m.TierCelebration })));
const OnboardingTutorial = lazy(() => import('@/components/onboarding/OnboardingTutorial').then(m => ({ default: m.OnboardingTutorial })));
const StreakDetailsSheet = lazy(() => import('@/components/streak/StreakDetailsSheet').then(m => ({ default: m.StreakDetailsSheet })));
const MilestoneCelebration = lazy(() => import('@/components/achievements/MilestoneCelebration').then(m => ({ default: m.MilestoneCelebration })));
const SessionSummarySheet = lazy(() => import('@/components/ui/session-summary-sheet').then(m => ({ default: m.SessionSummarySheet })));

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Track radio listening for rewards
  const { sessionSummary, showSummary, closeSummary } = useRadioRewards();
  const { isPlayerExpanded, setPlayerExpanded } = useRadioStore();
  const [showStreakDetails, setShowStreakDetails] = useState(false);
  
  // Tier reached celebration
  const { showCelebration, currentTierReward, currentTierName, nextTierInfo, dismissCelebration } = useTierReachedNotification();
  
  // Milestone celebration
  const { pendingMilestone, dismissMilestone } = useMilestoneStore();
  
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
        
        {/* Lazy-loaded overlays - only render when needed */}
        <Suspense fallback={null}>
          {/* Expanded Player Bottom Sheet */}
          {isPlayerExpanded && (
            <ExpandedRadioPlayer 
              isOpen={isPlayerExpanded} 
              onClose={() => setPlayerExpanded(false)} 
            />
          )}
          
          {/* Tier Reached Celebration */}
          {showCelebration && (
            <TierCelebration
              isVisible={showCelebration}
              talerAmount={currentTierReward}
              tierName={currentTierName}
              nextTierInfo={nextTierInfo}
              onDismiss={dismissCelebration}
            />
          )}
          
          {/* Milestone Celebration */}
          {pendingMilestone && (
            <MilestoneCelebration
              milestone={pendingMilestone}
              onClose={dismissMilestone}
            />
          )}
          
          {/* Streak Details Sheet */}
          {showStreakDetails && (
            <StreakDetailsSheet 
              open={showStreakDetails} 
              onOpenChange={setShowStreakDetails} 
            />
          )}
          
          {/* Onboarding Tutorial for new users */}
          <OnboardingTutorial />
          
          {/* Session Summary Modal */}
          {showSummary && (
            <SessionSummarySheet
              isOpen={showSummary}
              onClose={closeSummary}
              sessionData={sessionSummary}
            />
          )}
        </Suspense>
        
        <WhatsAppButton />
      </div>
    </BadgeNotificationProvider>
  );
}
