import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [userCode, setUserCode] = useState<UserCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPartnerAdmin, setIsPartnerAdmin] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<PartnerAdminInfo | null>(null);

  const loadUserData = async (userId: string) => {
    const [profileData, balanceData, codeData] = await Promise.all([
      getProfile(userId),
      getUserBalance(userId),
      getUserCode(userId),
    ]);
    
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

  const refreshBalance = async () => {
    if (user) {
      const balanceData = await getUserBalance(user.id);
      setBalance(balanceData);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await getProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer data loading to avoid deadlock
          setTimeout(() => {
            loadUserData(session.user.id);
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

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      balance,
      userCode,
      isLoading,
      isPartnerAdmin,
      partnerInfo,
      refreshBalance,
      refreshProfile,
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
  const { balance, refreshBalance } = useAuth();
  return { balance, refreshBalance };
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
