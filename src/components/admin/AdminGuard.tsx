import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { checkIsAdmin } from '@/lib/admin-helpers';
import { PageLoader } from '@/components/ui/loading-spinner';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function verifyAdminRole() {
      if (!user) {
        setIsAdmin(false);
        setIsChecking(false);
        return;
      }

      try {
        // Check admin role via server-side RLS function
        const hasAdminRole = await checkIsAdmin(user.id);
        setIsAdmin(hasAdminRole);
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    }

    if (!authLoading) {
      verifyAdminRole();
    }
  }, [user, authLoading]);

  // Show loading while checking auth and admin status
  if (authLoading || isChecking) {
    return <PageLoader />;
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Not an admin - redirect to home
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // User is admin - render children
  return <>{children}</>;
}
