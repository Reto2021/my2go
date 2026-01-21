import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  getProfile, 
  getUserBalance, 
  getUserCode,
  UserProfile,
  UserBalance,
  UserCode 
} from '@/lib/supabase-helpers';
import { checkIsPartnerAdmin, getPartnerAdminInfo, PartnerAdminInfo } from '@/lib/partner-helpers';
import { useMilestoneStore, checkMilestoneCrossed, getMilestoneData } from '@/lib/milestone-store';
import { useGuestRewardsStore } from '@/lib/guest-rewards-store';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  balance: UserBalance | null;
  userCode: UserCode | null;
  isLoading: boolean;
  isPartnerAdmin: boolean;
  partnerInfo: PartnerAdminInfo | null;
  refreshBalance: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Optimistic balance updates for real-time UI feedback
  addPendingTaler: (amount: number) => void;
  clearPendingTaler: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [pendingTaler, setPendingTaler] = useState(0);
  const [userCode, setUserCode] = useState<UserCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPartnerAdmin, setIsPartnerAdmin] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<PartnerAdminInfo | null>(null);

  // Add pending Taler for optimistic UI updates (e.g., when radio tier is reached)
  const addPendingTaler = useCallback((amount: number) => {
    setPendingTaler(prev => prev + amount);
  }, []);

  // Clear pending Taler when session ends and real balance is refreshed
  const clearPendingTaler = useCallback(() => {
    setPendingTaler(0);
  }, []);

  // Sync guest rewards to database after login
  const syncGuestRewards = async (userId: string) => {
    const guestStore = useGuestRewardsStore.getState();
    const guestTaler = guestStore.totalTalerEarned;
    
    if (guestTaler > 0) {
      try {
        // Insert transaction for guest rewards
        const { error } = await supabase.from('transactions').insert({
          user_id: userId,
          amount: guestTaler,
          type: 'earn' as const,
          source: 'bonus' as const,
          description: 'Gast-Hörbelohnung übertragen',
        });
        
        if (!error) {
          // Clear guest data after successful sync
          guestStore.clearGuestData();
          toast.success(`${guestTaler} Taler wurden deinem Konto gutgeschrieben!`, {
            description: 'Deine Gast-Hörbelohnungen wurden übertragen.',
          });
        } else {
          console.error('Failed to sync guest rewards:', error);
        }
      } catch (err) {
        console.error('Error syncing guest rewards:', err);
      }
    }
  };

  const loadUserData = async (userId: string, isNewLogin = false) => {
    console.log('[AuthContext] Loading user data for:', userId, 'isNewLogin:', isNewLogin);
    
    // Sync guest rewards first if this is a new login
    if (isNewLogin) {
      await syncGuestRewards(userId);
    }
    
    const [profileData, balanceData, codeData] = await Promise.all([
      getProfile(userId),
      getUserBalance(userId),
      getUserCode(userId),
    ]);
    
    console.log('[AuthContext] Loaded balance data:', balanceData);
    
    setProfile(profileData);
    setBalance(balanceData);
    setUserCode(codeData);
    
    // Check partner admin status
    const hasPartnerRole = await checkIsPartnerAdmin(userId);
    setIsPartnerAdmin(hasPartnerRole);
    
    if (hasPartnerRole) {
      const adminInfo = await getPartnerAdminInfo(userId);
      setPartnerInfo(adminInfo);
    } else {
      setPartnerInfo(null);
    }
  };

  // Track previous balance for milestone detection
  const prevBalanceRef = useRef<number | null>(null);
  const { triggerMilestone } = useMilestoneStore();

  const refreshBalance = async () => {
    if (user) {
      const balanceData = await getUserBalance(user.id);
      
      // Check for Taler milestones
      if (balanceData && prevBalanceRef.current !== null) {
        const crossedMilestone = checkMilestoneCrossed(
          'taler',
          balanceData.lifetime_earned,
          prevBalanceRef.current
        );
        if (crossedMilestone) {
          triggerMilestone(getMilestoneData('taler', crossedMilestone));
        }
      }
      
      // Update previous balance ref
      if (balanceData) {
        prevBalanceRef.current = balanceData.lifetime_earned;
      }
      
      setBalance(balanceData);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await getProfile(user.id);
      setProfile(profileData);
    }
  };

  // Subscribe to realtime transaction updates for cross-device sync
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`transactions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refresh balance when a new transaction is detected (from any device)
          refreshBalance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if this is a new sign-in event (not just session restore)
          const isNewLogin = event === 'SIGNED_IN';
          
          // Defer data loading to avoid deadlock
          setTimeout(() => {
            loadUserData(session.user.id, isNewLogin);
          }, 0);
        } else {
          setProfile(null);
          setBalance(null);
          setUserCode(null);
          setIsPartnerAdmin(false);
          setPartnerInfo(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserData(session.user.id).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Compute effective balance including pending Taler
  const effectiveBalance = balance ? {
    ...balance,
    taler_balance: balance.taler_balance + pendingTaler,
    lifetime_earned: balance.lifetime_earned + pendingTaler,
  } : null;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      balance: effectiveBalance,
      userCode,
      isLoading,
      isPartnerAdmin,
      partnerInfo,
      refreshBalance,
      refreshProfile,
      addPendingTaler,
      clearPendingTaler,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Safe version that returns null instead of throwing when outside provider
export function useAuthSafe() {
  const context = useContext(AuthContext);
  return context ?? null;
}

// Convenience hooks
export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useBalance() {
  const { balance, refreshBalance, addPendingTaler, clearPendingTaler } = useAuth();
  return { balance, refreshBalance, addPendingTaler, clearPendingTaler };
}

export function useProfile() {
  const { profile, refreshProfile } = useAuth();
  return { profile, refreshProfile };
}

export function useUserCode() {
  const { userCode } = useAuth();
  return userCode;
}

export function useIsAuthenticated() {
  const { user, isLoading } = useAuth();
  return { isAuthenticated: !!user, isLoading };
}

export function usePartnerAdmin() {
  const { isPartnerAdmin, partnerInfo } = useAuth();
  return { isPartnerAdmin, partnerInfo };
}
