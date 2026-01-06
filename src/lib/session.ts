/**
 * Session Management
 * 
 * IMPORTANT: This is a thin wrapper for session handling.
 * - Token comes from URL (?token=...)
 * - Session is stored in memory only (not persistent)
 * - No PII is stored in Lovable
 */

import { create } from 'zustand';
import { Session, validateSession, getBalance, TalerBalance } from './api';

interface SessionState {
  // Session data
  token: string | null;
  session: Session | null;
  balance: TalerBalance | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingBalance: boolean;
  
  // Actions
  initSession: (token: string | null) => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearSession: () => void;
}

export const useSession = create<SessionState>((set, get) => ({
  token: null,
  session: null,
  balance: null,
  isLoading: false,
  isLoadingBalance: false,
  
  initSession: async (token: string | null) => {
    set({ isLoading: true, token });
    
    try {
      const session = await validateSession(token);
      set({ session });
      
      if (session.valid && token) {
        set({ isLoadingBalance: true });
        const balance = await getBalance(token);
        set({ balance });
      }
    } catch (error) {
      console.error('Session init failed:', error);
      set({ session: { valid: false } });
    } finally {
      set({ isLoading: false, isLoadingBalance: false });
    }
  },
  
  refreshBalance: async () => {
    const { token, session } = get();
    
    if (!token || !session?.valid) return;
    
    set({ isLoadingBalance: true });
    
    try {
      const balance = await getBalance(token);
      set({ balance });
    } catch (error) {
      console.error('Balance refresh failed:', error);
    } finally {
      set({ isLoadingBalance: false });
    }
  },
  
  clearSession: () => {
    set({
      token: null,
      session: null,
      balance: null,
    });
  },
}));

// Helper to check if user is in browse mode (no valid session)
export const useBrowseMode = () => {
  const session = useSession(state => state.session);
  return !session?.valid;
};
