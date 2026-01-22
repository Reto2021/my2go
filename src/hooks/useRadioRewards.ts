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
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ============================================
// GLOBAL state for session management
// This ensures the interval persists across component remounts
// ============================================
let globalSessionId: string | null = null;
let globalStartTimeMs: number | null = null;
let globalSaveInterval: ReturnType<typeof setInterval> | null = null;
let globalSaveInProgress = false;
let globalIsStarting = false;
let globalIsEnding = false;
let globalRefreshBalance: (() => void) | undefined = undefined;

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

// Send beacon to end session on page unload (most reliable way)
function sendEndSessionBeacon(sessionId: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[RadioRewards] Missing Supabase config for beacon');
    return;
  }
  
  const url = `${SUPABASE_URL}/rest/v1/rpc/end_listening_session`;
  const payload = JSON.stringify({ _session_id: sessionId });
  
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };
  
  // Use fetch with keepalive for reliable delivery during page unload
  fetch(url, {
    method: 'POST',
    headers,
    body: payload,
    keepalive: true,
  }).catch(() => {
    console.log('[RadioRewards] fetch keepalive failed, session will be recovered on next load');
  });
  
  console.log('[RadioRewards] Sent end session beacon for:', sessionId);
}

// Direct RPC call to save progress - GLOBAL function that doesn't rely on React
async function saveProgressGlobal() {
  if (globalSaveInProgress) {
    console.log('[RadioRewards] 💾 Save already in progress, skipping');
    return;
  }
  
  if (!globalSessionId || !globalStartTimeMs) {
    console.log('[RadioRewards] 💾 No active session to save');
    return;
  }
  
  globalSaveInProgress = true;
  
  const currentDuration = Math.floor((Date.now() - globalStartTimeMs) / 1000);
  const sessionId = globalSessionId;
  
  console.log('[RadioRewards] 💾 Saving progress:', sessionId, 'duration:', currentDuration, 'seconds');
  
  try {
    const { data, error } = await supabase.rpc('save_session_progress', {
      _session_id: sessionId,
      _duration_seconds: currentDuration
    });
    
    if (error) {
      console.error('[RadioRewards] ❌ Error saving progress:', error);
    } else {
      console.log('[RadioRewards] ✅ Progress saved:', data);
      // Refresh balance if callback is available
      globalRefreshBalance?.();
    }
  } catch (err) {
    console.error('[RadioRewards] ❌ Exception saving progress:', err);
  } finally {
    globalSaveInProgress = false;
  }
}

// Start the global save interval
function startGlobalSaveInterval() {
  // Clear any existing interval first
  if (globalSaveInterval) {
    clearInterval(globalSaveInterval);
    globalSaveInterval = null;
  }
  
  console.log('[RadioRewards] ⏱️ Starting 15-second global save interval');
  
  // Start new interval
  globalSaveInterval = setInterval(() => {
    console.log('[RadioRewards] ⏱️ Interval tick');
    saveProgressGlobal();
  }, 15000);
}

// Stop the global save interval
function stopGlobalSaveInterval() {
  if (globalSaveInterval) {
    console.log('[RadioRewards] ⏱️ Stopping global save interval');
    clearInterval(globalSaveInterval);
    globalSaveInterval = null;
  }
}

export function useRadioRewards() {
  const authContext = useAuthSafe();
  const refreshBalance = authContext?.refreshBalance;
  const clearPendingTaler = authContext?.clearPendingTaler;
  const user = authContext?.user;
  const { isPlaying, isRadio2Go, isSwitching, isLoading } = useRadioStore();
  
  const lastStationTypeRef = useRef<boolean | null>(null);
  const pendingStationSwitchRef = useRef(false);
  const hasRecoveredRef = useRef(false);
  
  const [sessionSummary, setSessionSummary] = useState<SessionSummaryData | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showFirstTalerCelebration, setShowFirstTalerCelebration] = useState(false);
  const [firstTalerAmount, setFirstTalerAmount] = useState(0);
  
  const userId = user?.id;
  
  // Keep global refreshBalance updated
  useEffect(() => {
    globalRefreshBalance = refreshBalance;
  }, [refreshBalance]);
  
  // Recover and end any pending/orphaned sessions from previous page load
  useEffect(() => {
    if (!userId || hasRecoveredRef.current) return;
    hasRecoveredRef.current = true;
    
    // First, try to recover the specific pending session from localStorage
    const pending = getPendingSession();
    if (pending && pending.userId === userId) {
      console.log('[RadioRewards] Found pending session in localStorage:', pending.sessionId);
      
      // End the pending session
      supabase.rpc('end_listening_session', { _session_id: pending.sessionId })
        .then(({ data, error }) => {
          if (error) {
            console.error('[RadioRewards] Error recovering pending session:', error);
          } else {
            console.log('[RadioRewards] Recovered pending session result:', data);
            refreshBalance?.();
          }
          clearPendingSession();
        });
    } else {
      clearPendingSession();
    }
    
    // Also recover any orphaned sessions on the server
    console.log('[RadioRewards] Checking for orphaned sessions on server...');
    supabase.rpc('recover_orphaned_sessions', { _user_id: userId })
      .then(({ data, error }) => {
        if (error) {
          console.error('[RadioRewards] Error recovering orphaned sessions:', error);
        } else if (data && typeof data === 'object') {
          const result = data as { recovered_sessions?: number; total_reward?: number };
          if (result.recovered_sessions && result.recovered_sessions > 0) {
            console.log('[RadioRewards] Recovered orphaned sessions:', result);
            refreshBalance?.();
          }
        }
      });
  }, [userId, refreshBalance]);
  
  // Start a listening session when radio starts playing
  const startSession = useCallback(async () => {
    // Strict guard against duplicate starts
    if (!userId) {
      console.log('[RadioRewards] startSession skipped: no userId');
      return;
    }
    
    if (globalIsStarting) {
      console.log('[RadioRewards] startSession skipped: already starting');
      return;
    }
    
    if (globalSessionId) {
      console.log('[RadioRewards] startSession skipped: session already exists:', globalSessionId);
      return;
    }
    
    // Set guard IMMEDIATELY before any async work
    globalIsStarting = true;
    console.log('[RadioRewards] 🎵 Starting session for user:', userId);
    
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
        globalIsStarting = false;
        return;
      }
      
      const newSessionId = data as string;
      
      // Double-check we didn't get a duplicate start
      if (globalSessionId) {
        console.warn('[RadioRewards] Race condition detected, session already set:', globalSessionId);
        globalIsStarting = false;
        return;
      }
      
      // Update global session state
      globalSessionId = newSessionId;
      globalStartTimeMs = Date.now();
      
      // Save to localStorage for recovery after page refresh
      savePendingSession(newSessionId, userId);
      
      // Start the global 15-second save interval
      startGlobalSaveInterval();
      
      console.log('[RadioRewards] ✅ Session started:', newSessionId, 'stream:', streamType);
    } catch (error) {
      console.error('[RadioRewards] Error starting listening session:', error);
    } finally {
      globalIsStarting = false;
    }
  }, [userId]);
  
  // End a listening session when radio stops
  const endSession = useCallback(async () => {
    if (!globalSessionId) {
      console.log('[RadioRewards] endSession skipped: no session');
      return;
    }
    
    if (globalIsEnding) {
      console.log('[RadioRewards] endSession skipped: already ending');
      return;
    }
    
    // Set guard IMMEDIATELY
    globalIsEnding = true;
    console.log('[RadioRewards] 🛑 Ending session:', globalSessionId);
    
    // Stop the save interval immediately
    stopGlobalSaveInterval();
    
    // Save final progress before ending
    if (globalSessionId && globalStartTimeMs) {
      await saveProgressGlobal();
    }
    
    // Clear global state immediately to prevent double-calls
    const endingSessionId = globalSessionId;
    globalSessionId = null;
    globalStartTimeMs = null;
    
    if (!endingSessionId) {
      globalIsEnding = false;
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('end_listening_session', {
        _session_id: endingSessionId
      });
      
      // Clear from localStorage since we're properly ending it
      clearPendingSession();
      
      if (error) {
        console.error('[RadioRewards] Error ending listening session:', error);
        await refreshBalance?.();
        return;
      }
      
      const result = data as unknown as ListeningReward;
      console.log('[RadioRewards] ✅ Session ended with result:', result);
      
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
      globalIsEnding = false;
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
      if (hasStationTypeChanged && globalSessionId && !pendingStationSwitchRef.current) {
        pendingStationSwitchRef.current = true;
        console.log('[RadioRewards] Station type changed, ending old session and starting new');
        endSession().then(() => {
          setTimeout(() => {
            startSession();
            pendingStationSwitchRef.current = false;
          }, 150);
        });
      } else if (!globalSessionId && !pendingStationSwitchRef.current) {
        console.log('[RadioRewards] Starting new session, userId:', userId);
        startSession();
      }
    } else if (!isPlaying && globalSessionId && !pendingStationSwitchRef.current) {
      console.log('[RadioRewards] Playback stopped, ending session');
      endSession();
    }
    
    // Track current station type for next comparison
    lastStationTypeRef.current = isRadio2Go;
  }, [isPlaying, isRadio2Go, isSwitching, isLoading, userId, startSession, endSession]);
  
  // Handle visibility change - end session when app goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && globalSessionId) {
        console.log('[RadioRewards] App hidden, ending session');
        // Use beacon for reliability when tab is hidden
        sendEndSessionBeacon(globalSessionId);
        // Also try normal end for immediate processing
        endSession();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [endSession]);
  
  // Handle page unload - use beacon for reliable session ending
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (globalSessionId) {
        console.log('[RadioRewards] Page unloading, sending beacon to end session:', globalSessionId);
        sendEndSessionBeacon(globalSessionId);
      }
    };
    
    const handlePageHide = (event: PageTransitionEvent) => {
      if (globalSessionId && !event.persisted) {
        console.log('[RadioRewards] Page hiding (not cached), sending beacon:', globalSessionId);
        sendEndSessionBeacon(globalSessionId);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);
  
  // Cleanup on unmount - but DON'T clear the global interval!
  // The interval should persist across component remounts
  useEffect(() => {
    return () => {
      // Only cleanup if we're truly leaving the app
      // The global state persists for the lifetime of the page
    };
  }, []);
  
  return {
    sessionSummary,
    showSummary,
    closeSummary,
    showFirstTalerCelebration,
    firstTalerAmount,
    closeFirstTalerCelebration,
  };
}
