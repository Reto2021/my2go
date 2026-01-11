import { useState, useEffect, useCallback } from 'react';

export interface PendingAction {
  id: string;
  type: 'redemption' | 'code_claim' | 'streak_claim' | 'profile_update' | 'other';
  description: string;
  timestamp: Date;
  data?: unknown;
}

const PENDING_ACTIONS_KEY = 'my2go_pending_actions';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [wasOffline, setWasOffline] = useState(false);

  // Load pending actions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(PENDING_ACTIONS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPendingActions(parsed.map((a: PendingAction) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        })));
      } catch (e) {
        console.error('Failed to parse pending actions:', e);
      }
    }
  }, []);

  // Save pending actions to localStorage
  useEffect(() => {
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // If we were offline and now online, trigger sync
      if (!navigator.onLine) return;
      
      // Notify service worker to sync
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SYNC_PENDING_ACTIONS' });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for sync messages from service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_PENDING_ACTIONS') {
        // Clear pending actions after successful sync
        // In a real implementation, you'd process each action first
        console.log('[OnlineStatus] Syncing pending actions...');
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const addPendingAction = useCallback((action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const newAction: PendingAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setPendingActions(prev => [...prev, newAction]);
    return newAction.id;
  }, []);

  const removePendingAction = useCallback((id: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
  }, []);

  const clearWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  return {
    isOnline,
    wasOffline,
    pendingActions,
    pendingCount: pendingActions.length,
    addPendingAction,
    removePendingAction,
    clearPendingActions,
    clearWasOffline,
  };
}
