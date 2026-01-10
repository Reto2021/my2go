import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { RadioHeader } from '@/components/ui/radio-header';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { BadgeNotificationProvider } from '@/components/badges/BadgeNotificationProvider';
import { SessionSummarySheet } from '@/components/ui/session-summary-sheet';
import { useRadioRewards } from '@/hooks/useRadioRewards';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Track radio listening for rewards
  const { sessionSummary, showSummary, closeSummary } = useRadioRewards();
  
  return (
    <BadgeNotificationProvider>
      <div className="min-h-screen bg-background">
        <RadioHeader />
        <main className="pt-20 pb-24">
          {children || <Outlet />}
        </main>
        <BottomNav />
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
