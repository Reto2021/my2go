import { createContext, useContext, ReactNode } from 'react';
import { useOnlineStatus, PendingAction } from '@/hooks/useOnlineStatus';

interface OnlineStatusContextType {
  isOnline: boolean;
  wasOffline: boolean;
  pendingActions: PendingAction[];
  pendingCount: number;
  addPendingAction: (action: Omit<PendingAction, 'id' | 'timestamp'>) => string;
  removePendingAction: (id: string) => void;
  clearPendingActions: () => void;
  clearWasOffline: () => void;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | null>(null);

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const onlineStatus = useOnlineStatus();

  return (
    <OnlineStatusContext.Provider value={onlineStatus}>
      {children}
    </OnlineStatusContext.Provider>
  );
}

export function useOnlineStatusContext() {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    throw new Error('useOnlineStatusContext must be used within OnlineStatusProvider');
  }
  return context;
}
