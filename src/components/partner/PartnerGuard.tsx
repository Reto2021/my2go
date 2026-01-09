import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { checkIsPartnerAdmin, getPartnerAdminInfo, PartnerAdminInfo } from '@/lib/partner-helpers';
import { PageLoader } from '@/components/ui/loading-spinner';

interface PartnerGuardProps {
  children: React.ReactNode;
}

// Context to share partner info with child components
import { createContext, useContext } from 'react';

interface PartnerContextType {
  partnerInfo: PartnerAdminInfo | null;
  refetch: () => Promise<void>;
}

const PartnerContext = createContext<PartnerContextType>({ 
  partnerInfo: null, 
  refetch: async () => {} 
});

export function usePartner() {
  return useContext(PartnerContext);
}

export function PartnerGuard({ children }: PartnerGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [isPartnerAdmin, setIsPartnerAdmin] = useState<boolean | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<PartnerAdminInfo | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  const verifyPartnerRole = async () => {
    if (!user) {
      setIsPartnerAdmin(false);
      setIsChecking(false);
      return;
    }

    try {
      const hasPartnerRole = await checkIsPartnerAdmin(user.id);
      setIsPartnerAdmin(hasPartnerRole);
      
      if (hasPartnerRole) {
        const info = await getPartnerAdminInfo(user.id);
        setPartnerInfo(info);
      }
    } catch (error) {
      console.error('Error checking partner role:', error);
      setIsPartnerAdmin(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      verifyPartnerRole();
    }
  }, [user, authLoading]);

  // Show loading while checking auth and partner status
  if (authLoading || isChecking) {
    return <PageLoader />;
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Not a partner admin - redirect to home
  if (!isPartnerAdmin || !partnerInfo) {
    return <Navigate to="/" replace />;
  }

  // User is partner admin - render children
  return (
    <PartnerContext.Provider value={{ partnerInfo, refetch: verifyPartnerRole }}>
      {children}
    </PartnerContext.Provider>
  );
}
