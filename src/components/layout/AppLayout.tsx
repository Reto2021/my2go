import { ReactNode, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { RadioHeader } from '@/components/ui/radio-header';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { useSession } from '@/lib/session';

interface AppLayoutProps {
  children?: ReactNode;
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
        {children || <Outlet />}
      </main>
      <BottomNav />
      <WhatsAppButton />
    </div>
  );
}
