import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useComebackBonus() {
  const { user, profile, refreshBalance } = useAuth();
  const [showComebackBanner, setShowComebackBanner] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [bonusAwarded, setBonusAwarded] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !profile) return;
    
    // Check if user was inactive for 3+ days
    const lastActivity = profile.last_activity_at ? new Date(profile.last_activity_at) : null;
    if (!lastActivity) return;
    
    const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    // We can't check comeback_bonus_claimed_at from profile type, so just show if inactive 3+ days
    if (daysSinceActivity >= 3) {
      setShowComebackBanner(true);
    }
  }, [user, profile]);

  const claimBonus = async () => {
    if (!user) return;
    setIsClaiming(true);
    try {
      const { data, error } = await supabase.rpc('claim_comeback_bonus', { _user_id: user.id });
      if (error) throw error;
      const result = data as unknown as { success: boolean; bonus?: number; error?: string };
      if (result.success) {
        setBonusAwarded(result.bonus || 10);
        setShowComebackBanner(false);
        await refreshBalance();
      }
    } catch (err) {
      console.error('Comeback bonus error:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  const dismissBanner = () => setShowComebackBanner(false);
  const dismissCelebration = () => setBonusAwarded(null);

  return { showComebackBanner, isClaiming, bonusAwarded, claimBonus, dismissBanner, dismissCelebration };
}
