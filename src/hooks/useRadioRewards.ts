import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRadioStore } from '@/lib/radio-store';
import { useAuthSafe } from '@/contexts/AuthContext';
import { triggerTalerAnimation } from '@/components/taler/TalerEarnAnimation';

// Force HMR boundary to prevent React queue corruption during hot reload
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    window.location.reload();
  });
}

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
  const { isPlaying, isRadio2Go, isSwitching, isLoading } = useRadioStore();
  
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const userIdRef = useRef<string | null>(null);
  const isStartingRef = useRef(false);
  const isEndingRef = useRef(false);
  const lastStationTypeRef = useRef<boolean | null>(null); // Track station type for switch detection
  const pendingStationSwitchRef = useRef(false); // Track if we're in the middle of a station switch
  
  const [sessionSummary, setSessionSummary] = useState<SessionSummaryData | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showFirstTalerCelebration, setShowFirstTalerCelebration] = useState(false);
  const [firstTalerAmount, setFirstTalerAmount] = useState(0);
  
  // Get user ID from Supabase auth - store in ref to avoid re-renders
  useEffect(() => {
    let isMounted = true;
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;
      userIdRef.current = user?.id || null;
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      userIdRef.current = session?.user?.id || null;
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Start a listening session when radio starts playing
  const startSession = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId || isStartingRef.current || sessionIdRef.current) return;
    
    isStartingRef.current = true;
    
    // Get current station info from radio store
    const radioStore = await import('@/lib/radio-store').then(m => m.useRadioStore.getState());
    const streamType = radioStore.isRadio2Go ? 'radio2go' : 'external';
    const stationName = radioStore.customStation?.name || null;
    const stationUuid = radioStore.customStation?.uuid || null;
    
    try {
      const { data, error } = await supabase.rpc('start_listening_session', {
        _user_id: userId,
        _stream_type: streamType,
        _station_name: stationName,
        _station_uuid: stationUuid,
      });
      
      if (error) {
        console.error('Error starting listening session:', error);
        return;
      }
      
      sessionIdRef.current = data as string;
      startTimeRef.current = new Date();
      console.log('Radio listening session started:', data, 'stream:', streamType);
    } catch (error) {
      console.error('Error starting listening session:', error);
    } finally {
      isStartingRef.current = false;
    }
  }, []);
  
  // End a listening session when radio stops
  const endSession = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    const userId = userIdRef.current;
    
    if (!sessionId || isEndingRef.current) return;
    
    isEndingRef.current = true;
    
    // Clear refs immediately to prevent double-calls
    sessionIdRef.current = null;
    startTimeRef.current = null;
    
    try {
      const { data, error } = await supabase.rpc('end_listening_session', {
        _session_id: sessionId
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
        if (!hasSeenFirstTaler && userId) {
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
        
        // Refresh balance from server FIRST, then clear pending to avoid visual drop
        await refreshBalance?.();
        clearPendingTaler?.();
      }
    } catch (error) {
      console.error('Error ending listening session:', error);
    } finally {
      isEndingRef.current = false;
    }
  }, [refreshBalance, clearPendingTaler]);
  
  const closeSummary = useCallback(() => {
    setShowSummary(false);
    setSessionSummary(null);
  }, []);
  
  const closeFirstTalerCelebration = useCallback(() => {
    setShowFirstTalerCelebration(false);
  }, []);
  
  // Track play/pause state changes AND station type changes
  // Option A: End session and start new one when switching between Radio 2Go and external
  useEffect(() => {
    // CRITICAL: Ignore state changes during station switching or loading
    // This prevents premature session ending during the brief pause between stations
    if (isSwitching || isLoading) {
      console.log('[RadioRewards] Ignoring state change during switch/load');
      return;
    }
    
    const hasStationTypeChanged = lastStationTypeRef.current !== null && 
                                   lastStationTypeRef.current !== isRadio2Go;
    
    if (isPlaying && userIdRef.current) {
      // If station type changed while playing, end old session first, then start new
      if (hasStationTypeChanged && sessionIdRef.current && !pendingStationSwitchRef.current) {
        pendingStationSwitchRef.current = true;
        console.log('[RadioRewards] Station type changed, ending old session and starting new');
        endSession().then(() => {
          // Small delay to ensure clean separation
          setTimeout(() => {
            startSession();
            pendingStationSwitchRef.current = false;
          }, 150);
        });
      } else if (!sessionIdRef.current && !pendingStationSwitchRef.current) {
        console.log('[RadioRewards] Starting new session');
        startSession();
      }
    } else if (!isPlaying && sessionIdRef.current && !pendingStationSwitchRef.current) {
      console.log('[RadioRewards] Playback stopped, ending session');
      endSession();
    }
    
    // Track current station type for next comparison
    lastStationTypeRef.current = isRadio2Go;
  }, [isPlaying, isRadio2Go, isSwitching, isLoading, startSession, endSession]);
  
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
