import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { RadioHeader } from '@/components/ui/radio-header';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { BadgeNotificationProvider } from '@/components/badges/BadgeNotificationProvider';
import { SessionSummarySheet } from '@/components/ui/session-summary-sheet';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { MiniPlayerBar } from '@/components/ui/mini-player-bar';
import { ExpandedRadioPlayer } from '@/components/ui/radio-player-expanded';
import { useRadioRewards } from '@/hooks/useRadioRewards';
import { useRadioStore } from '@/lib/radio-store';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Track radio listening for rewards
  const { sessionSummary, showSummary, closeSummary } = useRadioRewards();
  const { isPlayerExpanded, setPlayerExpanded } = useRadioStore();
  
  return (
    <BadgeNotificationProvider>
      <div className="min-h-screen bg-background">
        <OfflineIndicator />
        <RadioHeader />
        <main className="pt-20 pb-24">
          {children || <Outlet />}
        </main>
        <BottomNav />
        
        {/* Mini Player Bar - appears when radio is playing */}
        <MiniPlayerBar onExpand={() => setPlayerExpanded(true)} />
        
        {/* Expanded Player Bottom Sheet */}
        <ExpandedRadioPlayer 
          isOpen={isPlayerExpanded} 
          onClose={() => setPlayerExpanded(false)} 
        />
        
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
