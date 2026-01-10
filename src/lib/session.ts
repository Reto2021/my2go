/**
 * Session Management - Cookie-based Persistence
 * 
 * ARCHITECTURE:
 * - First visit: Token via URL (?token=...) → Gateway sets httpOnly cookie
 * - Subsequent visits: /api/me reads cookie → returns session data
 * - No tokens stored in localStorage/memory
 * - Logout: POST /api/session/logout → Gateway clears cookie
 * 
 * RAILGUARDS:
 * - No PII stored in Lovable
 * - No tokens in client storage
 * - Cookie is httpOnly, Secure, SameSite=Strict (set by Gateway)
 */

import { create } from 'zustand';
import { 
  exchangeTokenForSession, 
  getCurrentSession, 
  logoutSession,
  refreshSessionBalance,
  SessionResponse,
  TalerBalance 
} from './api';

interface SessionState {
  // Session data (from /api/me)
  session: SessionResponse | null;
  balance: TalerBalance | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingBalance: boolean;
  isLoggingOut: boolean;
  
  // Actions
  initSession: () => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useSession = create<SessionState>((set, get) => ({
  session: null,
  balance: null,
  isLoading: false,
  isLoadingBalance: false,
  isLoggingOut: false,
  
  /**
   * Initialize session on app load
   * 1. Check for URL token → exchange for cookie session
   * 2. Call /api/me to check current session (via cookie)
   */
  initSession: async () => {
    set({ isLoading: true });
    
    try {
      // Step 1: Check for token in URL
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token') || urlParams.get('t');
      
      if (urlToken) {
        // Exchange token for session (Gateway sets httpOnly cookie)
        await exchangeTokenForSession(urlToken);
        
        // Clean URL (remove token parameter)
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('token');
        cleanUrl.searchParams.delete('t');
        window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search);
      }
      
      // Step 2: Get current session (Gateway reads cookie)
      const sessionData = await getCurrentSession();
      
      set({ 
        session: sessionData,
        balance: sessionData.hasSession ? {
          current: sessionData.balance || 0,
          pending: sessionData.pendingBalance || 0,
          lifetime: sessionData.lifetimeBalance || 0,
        } : null
      });
      
    } catch (error) {
      console.error('Session init failed:', error);
      set({ 
        session: { hasSession: false },
        balance: null 
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  /**
   * Login with token without page reload
   * Used by "Karte öffnen" buttons to preserve audio stream
   */
  loginWithToken: async (token: string) => {
    set({ isLoading: true });
    
    try {
      // Exchange token for session (Gateway sets httpOnly cookie)
      await exchangeTokenForSession(token);
      
      // Get current session (Gateway reads cookie)
      const sessionData = await getCurrentSession();
      
      set({ 
        session: sessionData,
        balance: sessionData.hasSession ? {
          current: sessionData.balance || 0,
          pending: sessionData.pendingBalance || 0,
          lifetime: sessionData.lifetimeBalance || 0,
        } : null
      });
      
    } catch (error) {
      console.error('Login with token failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  /**
   * Refresh balance from server
   * Used after redemptions or code submissions
   */
  refreshBalance: async () => {
    const { session } = get();
    if (!session?.hasSession) return;
    
    set({ isLoadingBalance: true });
    
    try {
      const balance = await refreshSessionBalance();
      set({ 
        balance: {
          current: balance.current,
          pending: balance.pending,
          lifetime: balance.lifetime,
        }
      });
    } catch (error) {
      console.error('Balance refresh failed:', error);
    } finally {
      set({ isLoadingBalance: false });
    }
  },
  
  /**
   * Logout and clear session
   * POST /api/session/logout → Gateway clears cookie
   */
  logout: async () => {
    set({ isLoggingOut: true });
    
    try {
      await logoutSession();
      set({
        session: { hasSession: false },
        balance: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      set({ isLoggingOut: false });
    }
  },
}));

// Helper to check if user is in browse mode (no valid session)
export const useBrowseMode = () => {
  const session = useSession(state => state.session);
  return !session?.hasSession;
};

// Helper to get display name
export const useDisplayName = () => {
  const session = useSession(state => state.session);
  return session?.displayName;
};
