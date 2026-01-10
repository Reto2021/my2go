import { useEffect, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { checkIsPartnerAdmin, getPartnerAdminInfo, getPartnerDetails, PartnerAdminInfo } from '@/lib/partner-helpers';
import { PageLoader } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';

interface PartnerGuardProps {
  children: React.ReactNode;
}

// Context to share partner info with child components
import { createContext, useContext } from 'react';

interface PartnerContextType {
  partnerInfo: PartnerAdminInfo | null;
  refetch: () => Promise<void>;
  isAdminOverride?: boolean;
}

const PartnerContext = createContext<PartnerContextType>({ 
  partnerInfo: null, 
  refetch: async () => {},
  isAdminOverride: false
});

export function usePartner() {
  return useContext(PartnerContext);
}

export function PartnerGuard({ children }: PartnerGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [isPartnerAdmin, setIsPartnerAdmin] = useState<boolean | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<PartnerAdminInfo | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isAdminOverride, setIsAdminOverride] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Check for admin override via partner_id query param
  const overridePartnerId = searchParams.get('partner_id');

  const checkIsSystemAdmin = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .rpc('has_role', { _user_id: userId, _role: 'admin' });
    
    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
    
    return data === true;
  };

  const verifyPartnerRole = async () => {
    if (!user) {
      setIsPartnerAdmin(false);
      setIsChecking(false);
      return;
    }

    try {
      // If there's an override partner_id, check if user is system admin
      if (overridePartnerId) {
        const isAdmin = await checkIsSystemAdmin(user.id);
        
        if (isAdmin) {
          // Admin can view any partner dashboard
          const partner = await getPartnerDetails(overridePartnerId);
          
          if (partner) {
            setPartnerInfo({
              partnerId: partner.id,
              partnerName: partner.name,
              role: 'owner', // Admin has full access
              canManageRewards: true,
              canViewReports: true,
              canConfirmRedemptions: true,
            });
            setIsPartnerAdmin(true);
            setIsAdminOverride(true);
            setIsChecking(false);
            return;
          }
        }
      }
      
      // Normal partner admin check
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
  }, [user, authLoading, overridePartnerId]);

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
    <PartnerContext.Provider value={{ partnerInfo, refetch: verifyPartnerRole, isAdminOverride }}>
      {children}
    </PartnerContext.Provider>
  );
}
