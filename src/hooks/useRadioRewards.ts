import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRadioStore } from '@/lib/radio-store';
import { useAuthSafe } from '@/contexts/AuthContext';
import { triggerTalerAnimation } from '@/components/taler/TalerEarnAnimation';

const FIRST_TALER_KEY = 'first_taler_celebrated';

interface ListeningReward {
  success: boolean;
  duration: number;
  reward: number;
  tier?: string;
  message: string;
}

export interface SessionSummaryData {
  duration: number;
  reward: number;
  tier?: string;
}

export function useRadioRewards() {
  const authContext = useAuthSafe();
  const refreshBalance = authContext?.refreshBalance;
  const clearPendingTaler = authContext?.clearPendingTaler;
  const { isPlaying } = useRadioStore();
  
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummaryData | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showFirstTalerCelebration, setShowFirstTalerCelebration] = useState(false);
  const [firstTalerAmount, setFirstTalerAmount] = useState(0);
  
  // Get user ID from Supabase auth
  useEffect(() => {
    let isMounted = true;
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;
      const newUserId = user?.id || null;
      previousUserIdRef.current = newUserId;
      setUserId(newUserId);
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      const newUserId = session?.user?.id || null;
      
      // Only update userId if it actually changed (not just token refresh)
      if (newUserId !== previousUserIdRef.current) {
        previousUserIdRef.current = newUserId;
        setUserId(newUserId);
      }
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Start a listening session when radio starts playing
  const startSession = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase.rpc('start_listening_session', {
        _user_id: userId
      });
      
      if (error) {
        console.error('Error starting listening session:', error);
        return;
      }
      
      sessionIdRef.current = data as string;
      startTimeRef.current = new Date();
      console.log('Radio listening session started:', data);
    } catch (error) {
      console.error('Error starting listening session:', error);
    }
  }, [userId]);
  
  // End a listening session when radio stops
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return;
    
    try {
      const { data, error } = await supabase.rpc('end_listening_session', {
        _session_id: sessionIdRef.current
      });
      
      if (error) {
        console.error('Error ending listening session:', error);
        return;
      }
      
      const result = data as unknown as ListeningReward;
      
      if (result?.success && result.reward > 0) {
        // Trigger visual Taler animation
        triggerTalerAnimation(result.reward, 'radio');
        
        // Check if this is the user's first Taler
        const hasSeenFirstTaler = localStorage.getItem(`${FIRST_TALER_KEY}_${userId}`);
        if (!hasSeenFirstTaler) {
          localStorage.setItem(`${FIRST_TALER_KEY}_${userId}`, 'true');
          setFirstTalerAmount(result.reward);
          setShowFirstTalerCelebration(true);
        }
        
        // Show session summary modal
        setSessionSummary({
          duration: result.duration,
          reward: result.reward,
          tier: result.tier,
        });
        setShowSummary(true);
        
        // Clear pending Taler (optimistic balance) and refresh from server
        clearPendingTaler?.();
        refreshBalance?.();
      }
      
      sessionIdRef.current = null;
      startTimeRef.current = null;
    } catch (error) {
      console.error('Error ending listening session:', error);
    }
  }, [refreshBalance, clearPendingTaler, userId]);
  
  const closeSummary = useCallback(() => {
    setShowSummary(false);
    setSessionSummary(null);
  }, []);
  
  const closeFirstTalerCelebration = useCallback(() => {
    setShowFirstTalerCelebration(false);
  }, []);
  
  // Track play/pause state changes
  useEffect(() => {
    if (!userId) return;
    
    if (isPlaying) {
      startSession();
    } else if (sessionIdRef.current) {
      endSession();
    }
    
    // NOTE: No cleanup on unmount!
    // Mobile browsers may unmount/remount components when screen locks/unlocks
    // while audio continues playing. We only end sessions on explicit stop (isPlaying=false)
    // or page unload (handled separately with sendBeacon).
  }, [isPlaying, userId, startSession, endSession]);
  
  // Also end session on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (sessionIdRef.current) {
        // Use sendBeacon for reliable delivery on page close
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/end_listening_session`;
        const body = JSON.stringify({ _session_id: sessionIdRef.current });
        
        navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }));
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);
  
  return {
    isTracking: !!sessionIdRef.current,
    startTime: startTimeRef.current,
    sessionSummary,
    showSummary,
    closeSummary,
    showFirstTalerCelebration,
    firstTalerAmount,
    closeFirstTalerCelebration,
  };
}
