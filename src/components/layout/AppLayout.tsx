import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { GlobalRadioPlayer } from '@/components/ui/global-radio-player';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24">
        {children}
      </main>
      <GlobalRadioPlayer />
      <BottomNav />
    </div>
  );
}
