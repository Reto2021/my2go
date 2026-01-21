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
const PENDING_SESSION_KEY = 'pending_radio_session';

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

interface PendingSession {
  sessionId: string;
  userId: string;
  startTime: number;
}

// Save pending session to localStorage for recovery after refresh
function savePendingSession(sessionId: string, userId: string) {
  const data: PendingSession = {
    sessionId,
    userId,
    startTime: Date.now(),
  };
  localStorage.setItem(PENDING_SESSION_KEY, JSON.stringify(data));
  console.log('[RadioRewards] Saved pending session to localStorage:', sessionId);
}

function clearPendingSession() {
  localStorage.removeItem(PENDING_SESSION_KEY);
  console.log('[RadioRewards] Cleared pending session from localStorage');
}

function getPendingSession(): PendingSession | null {
  try {
    const data = localStorage.getItem(PENDING_SESSION_KEY);
    if (!data) return null;
    return JSON.parse(data) as PendingSession;
  } catch {
    return null;
  }
}

export function useRadioRewards() {
  const authContext = useAuthSafe();
  const refreshBalance = authContext?.refreshBalance;
  const clearPendingTaler = authContext?.clearPendingTaler;
  const user = authContext?.user;
  const { isPlaying, isRadio2Go, isSwitching, isLoading } = useRadioStore();
  
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const isStartingRef = useRef(false);
  const isEndingRef = useRef(false);
  const lastStationTypeRef = useRef<boolean | null>(null);
  const pendingStationSwitchRef = useRef(false);
  const hasRecoveredRef = useRef(false);
  
  const [sessionSummary, setSessionSummary] = useState<SessionSummaryData | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showFirstTalerCelebration, setShowFirstTalerCelebration] = useState(false);
  const [firstTalerAmount, setFirstTalerAmount] = useState(0);
  
  const userId = user?.id;
  
  // Recover and end any pending sessions from previous page load
  useEffect(() => {
    if (!userId || hasRecoveredRef.current) return;
    hasRecoveredRef.current = true;
    
    const pending = getPendingSession();
    if (pending && pending.userId === userId) {
      console.log('[RadioRewards] Found pending session to recover:', pending.sessionId);
      
      // End the pending session
      supabase.rpc('end_listening_session', { _session_id: pending.sessionId })
        .then(({ data, error }) => {
          if (error) {
            console.error('[RadioRewards] Error recovering session:', error);
          } else {
            console.log('[RadioRewards] Recovered session result:', data);
            refreshBalance?.();
          }
          clearPendingSession();
        });
    } else {
      clearPendingSession();
    }
  }, [userId, refreshBalance]);
  
  // Start a listening session when radio starts playing
  const startSession = useCallback(async () => {
    if (!userId || isStartingRef.current || sessionIdRef.current) {
      console.log('[RadioRewards] startSession skipped:', { userId, isStarting: isStartingRef.current, hasSession: !!sessionIdRef.current });
      return;
    }
    
    isStartingRef.current = true;
    console.log('[RadioRewards] Starting session for user:', userId);
    
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
        console.error('[RadioRewards] Error starting listening session:', error);
        return;
      }
      
      const newSessionId = data as string;
      sessionIdRef.current = newSessionId;
      startTimeRef.current = new Date();
      
      // Save to localStorage for recovery after page refresh
      savePendingSession(newSessionId, userId);
      
      console.log('[RadioRewards] Session started:', newSessionId, 'stream:', streamType);
    } catch (error) {
      console.error('[RadioRewards] Error starting listening session:', error);
    } finally {
      isStartingRef.current = false;
    }
  }, [userId]);
  
  // End a listening session when radio stops
  const endSession = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    
    if (!sessionId || isEndingRef.current) {
      console.log('[RadioRewards] endSession skipped - no session or already ending');
      return;
    }
    
    isEndingRef.current = true;
    console.log('[RadioRewards] Ending session:', sessionId);
    
    // Clear refs immediately to prevent double-calls
    sessionIdRef.current = null;
    startTimeRef.current = null;
    
    try {
      const { data, error } = await supabase.rpc('end_listening_session', {
        _session_id: sessionId
      });
      
      // Clear from localStorage since we're properly ending it
      clearPendingSession();
      
      if (error) {
        console.error('[RadioRewards] Error ending listening session:', error);
        await refreshBalance?.();
        return;
      }
      
      const result = data as unknown as ListeningReward;
      console.log('[RadioRewards] Session ended with result:', result);
      
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
      }
      
      // ALWAYS refresh balance after session ends
      console.log('[RadioRewards] Refreshing balance after session end');
      await refreshBalance?.();
      clearPendingTaler?.();
      
    } catch (error) {
      console.error('[RadioRewards] Error ending listening session:', error);
      await refreshBalance?.();
    } finally {
      isEndingRef.current = false;
    }
  }, [userId, refreshBalance, clearPendingTaler]);
  
  const closeSummary = useCallback(() => {
    setShowSummary(false);
    setSessionSummary(null);
  }, []);
  
  const closeFirstTalerCelebration = useCallback(() => {
    setShowFirstTalerCelebration(false);
  }, []);
  
  // Track play/pause state changes AND station type changes
  useEffect(() => {
    // Wait for user to be authenticated
    if (!userId) {
      console.log('[RadioRewards] Waiting for user authentication');
      return;
    }
    
    // Ignore state changes during station switching or loading
    if (isSwitching || isLoading) {
      console.log('[RadioRewards] Ignoring state change during switch/load');
      return;
    }
    
    const hasStationTypeChanged = lastStationTypeRef.current !== null && 
                                   lastStationTypeRef.current !== isRadio2Go;
    
    if (isPlaying) {
      // If station type changed while playing, end old session first, then start new
      if (hasStationTypeChanged && sessionIdRef.current && !pendingStationSwitchRef.current) {
        pendingStationSwitchRef.current = true;
        console.log('[RadioRewards] Station type changed, ending old session and starting new');
        endSession().then(() => {
          setTimeout(() => {
            startSession();
            pendingStationSwitchRef.current = false;
          }, 150);
        });
      } else if (!sessionIdRef.current && !pendingStationSwitchRef.current) {
        console.log('[RadioRewards] Starting new session, userId:', userId);
        startSession();
      }
    } else if (!isPlaying && sessionIdRef.current && !pendingStationSwitchRef.current) {
      console.log('[RadioRewards] Playback stopped, ending session');
      endSession();
    }
    
    // Track current station type for next comparison
    lastStationTypeRef.current = isRadio2Go;
  }, [isPlaying, isRadio2Go, isSwitching, isLoading, userId, startSession, endSession]);
  
  // Handle visibility change - end session when app goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionIdRef.current) {
        console.log('[RadioRewards] App hidden, ending session');
        endSession();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [endSession]);
  
  // Handle page unload - save session for recovery
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Session is already saved to localStorage when started
      // It will be recovered on next page load
      console.log('[RadioRewards] Page unloading, session will be recovered on reload');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
