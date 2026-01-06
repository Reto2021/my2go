import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { RadioHeader } from '@/components/ui/radio-header';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <RadioHeader />
      <main className="pt-14 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
