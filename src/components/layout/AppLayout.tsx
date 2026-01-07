import { ReactNode, useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { RadioHeader } from '@/components/ui/radio-header';
import { useSession } from '@/lib/session';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { initSession } = useSession();
  
  // Initialize session on app load (handles URL token + cookie)
  useEffect(() => {
    initSession();
  }, [initSession]);
  
  return (
    <div className="min-h-screen bg-background">
      <RadioHeader />
      <main className="pt-20 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
