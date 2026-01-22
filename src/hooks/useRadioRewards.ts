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
let globalUserId: string | null = null;

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
function savePendingSession(sessionId: string, userId: string, startTime: number) {
  const data: PendingSession = {
    sessionId,
    userId,
    startTime,
  };
  localStorage.setItem(PENDING_SESSION_KEY, JSON.stringify(data));
  console.log('[RadioRewards] 💾 Saved pending session to localStorage:', sessionId, 'startTime:', startTime);
}

function clearPendingSession() {
  localStorage.removeItem(PENDING_SESSION_KEY);
  console.log('[RadioRewards] 🗑️ Cleared pending session from localStorage');
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

// Direct RPC call to save progress - GLOBAL function that doesn't rely on React
async function saveProgressGlobal(): Promise<boolean> {
  if (globalSaveInProgress) {
    console.log('[RadioRewards] 💾 Save already in progress, skipping');
    return false;
  }
  
  if (!globalSessionId || !globalStartTimeMs) {
    console.log('[RadioRewards] 💾 No active session to save (sessionId:', globalSessionId, ', startTime:', globalStartTimeMs, ')');
    return false;
  }
  
  globalSaveInProgress = true;
  
  const currentDuration = Math.floor((Date.now() - globalStartTimeMs) / 1000);
  const sessionId = globalSessionId;
  
  console.log('[RadioRewards] 💾 Saving progress:', sessionId, 'duration:', currentDuration, 'seconds');
  
  // Only save if we've listened long enough to potentially earn something (60+ seconds = first tier)
  if (currentDuration < 60) {
    console.log('[RadioRewards] 💾 Duration too short for first tier (', currentDuration, 's < 60s), skipping save');
    globalSaveInProgress = false;
    return false;
  }
  
  try {
    const { data, error } = await supabase.rpc('save_session_progress', {
      _session_id: sessionId,
      _duration_seconds: currentDuration
    });
    
    if (error) {
      console.error('[RadioRewards] ❌ Error saving progress:', error);
      globalSaveInProgress = false;
      return false;
    } else {
      console.log('[RadioRewards] ✅ Progress saved successfully:', data);
      // Refresh balance if callback is available
      if (globalRefreshBalance) {
        console.log('[RadioRewards] 🔄 Triggering balance refresh...');
        globalRefreshBalance();
      }
      globalSaveInProgress = false;
      return true;
    }
  } catch (err) {
    console.error('[RadioRewards] ❌ Exception saving progress:', err);
    globalSaveInProgress = false;
    return false;
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
  
  // Start new interval - saves progress every 15 seconds
  globalSaveInterval = setInterval(() => {
    console.log('[RadioRewards] ⏱️ Interval tick - attempting to save progress...');
    saveProgressGlobal();
  }, 15000);
  
  // IMPORTANT: Also do a first save after 65 seconds (when first tier is reached)
  // This ensures we capture the first tier even if the user leaves before the interval triggers
  setTimeout(() => {
    console.log('[RadioRewards] ⏱️ First tier check triggered (65s elapsed since interval start)');
    saveProgressGlobal();
  }, 65000);
}

// Stop the global save interval
function stopGlobalSaveInterval() {
  if (globalSaveInterval) {
    console.log('[RadioRewards] ⏱️ Stopping global save interval');
    clearInterval(globalSaveInterval);
    globalSaveInterval = null;
  }
}

// Resume session from localStorage if radio is playing and session exists
async function resumeSessionFromStorage(userId: string): Promise<boolean> {
  const pending = getPendingSession();
  
  if (!pending) {
    console.log('[RadioRewards] No pending session in localStorage');
    return false;
  }
  
  if (pending.userId !== userId) {
    console.log('[RadioRewards] Pending session belongs to different user');
    clearPendingSession();
    return false;
  }
  
  // Check if session is still active on server
  const { data: session, error } = await supabase
    .from('radio_listening_sessions')
    .select('id, ended_at, started_at')
    .eq('id', pending.sessionId)
    .single();
  
  if (error || !session || session.ended_at) {
    console.log('[RadioRewards] Pending session no longer active on server');
    clearPendingSession();
    return false;
  }
  
  // Session is still active! Resume it
  console.log('[RadioRewards] 🔄 RESUMING session from localStorage:', pending.sessionId);
  
  globalSessionId = pending.sessionId;
  globalStartTimeMs = pending.startTime;
  globalUserId = userId;
  
  // Start the save interval immediately
  startGlobalSaveInterval();
  
  // Do an immediate save to sync progress
  setTimeout(() => {
    console.log('[RadioRewards] 🔄 Immediate save after resume');
    saveProgressGlobal();
  }, 1000);
  
  return true;
}

export function useRadioRewards() {
  const authContext = useAuthSafe();
  const refreshBalance = authContext?.refreshBalance;
  const clearPendingTaler = authContext?.clearPendingTaler;
  const user = authContext?.user;
  const { isPlaying, isRadio2Go, isSwitching, isLoading } = useRadioStore();
  
  const lastStationTypeRef = useRef<boolean | null>(null);
  const pendingStationSwitchRef = useRef(false);
  const hasResumedRef = useRef(false);
  
  const [sessionSummary, setSessionSummary] = useState<SessionSummaryData | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showFirstTalerCelebration, setShowFirstTalerCelebration] = useState(false);
  const [firstTalerAmount, setFirstTalerAmount] = useState(0);
  
  const userId = user?.id;
  
  // Keep global refreshBalance updated
  useEffect(() => {
    globalRefreshBalance = refreshBalance;
    if (userId) {
      globalUserId = userId;
    }
  }, [refreshBalance, userId]);
  
  // On mount: Try to resume session from localStorage if radio is playing
  useEffect(() => {
    if (!userId || hasResumedRef.current) return;
    hasResumedRef.current = true;
    
    // Check if radio is currently playing and we have a pending session
    const radioStore = useRadioStore.getState();
    
    if (radioStore.isPlaying) {
      // Radio is playing, try to resume session
      resumeSessionFromStorage(userId).then(resumed => {
        if (resumed) {
          console.log('[RadioRewards] ✅ Successfully resumed session after page reload');
        }
      });
    } else {
      // Radio is not playing, end any orphaned sessions
      const pending = getPendingSession();
      if (pending && pending.userId === userId) {
        console.log('[RadioRewards] Radio not playing, ending orphaned session:', pending.sessionId);
        
        // Calculate duration and save progress before ending
        const durationSeconds = Math.floor((Date.now() - pending.startTime) / 1000);
        
        // First save progress, then end session
        if (durationSeconds >= 60) {
          supabase.rpc('save_session_progress', {
            _session_id: pending.sessionId,
            _duration_seconds: durationSeconds
          }).then(({ error }) => {
            if (error) {
              console.error('[RadioRewards] Error saving orphaned session progress:', error);
            } else {
              console.log('[RadioRewards] ✅ Saved orphaned session progress');
            }
            
            // Now end the session
            supabase.rpc('end_listening_session', { _session_id: pending.sessionId })
              .then(({ data, error: endError }) => {
                if (endError) {
                  console.error('[RadioRewards] Error ending orphaned session:', endError);
                } else {
                  console.log('[RadioRewards] ✅ Ended orphaned session:', data);
                  refreshBalance?.();
                }
                clearPendingSession();
              });
          });
        } else {
          // Too short, just end without saving
          supabase.rpc('end_listening_session', { _session_id: pending.sessionId })
            .then(({ data, error }) => {
              if (error) {
                console.error('[RadioRewards] Error ending orphaned session:', error);
              } else {
                console.log('[RadioRewards] ✅ Ended short orphaned session:', data);
              }
              clearPendingSession();
            });
        }
      }
      
      // Also recover any other orphaned sessions on the server
      console.log('[RadioRewards] Checking for orphaned sessions on server...');
      supabase.rpc('recover_orphaned_sessions', { _user_id: userId })
        .then(({ data, error }) => {
          if (error) {
            console.error('[RadioRewards] Error recovering orphaned sessions:', error);
          } else if (data && typeof data === 'object') {
            const result = data as { recovered_sessions?: number; total_reward?: number };
            if (result.recovered_sessions && result.recovered_sessions > 0) {
              console.log('[RadioRewards] ✅ Recovered orphaned sessions:', result);
              refreshBalance?.();
            }
          }
        });
    }
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
    console.log('[RadioRewards] 🎵 Starting NEW session for user:', userId);
    
    // Get current station info from radio store
    const radioStore = useRadioStore.getState();
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
      const startTime = Date.now();
      globalSessionId = newSessionId;
      globalStartTimeMs = startTime;
      globalUserId = userId;
      
      // Save to localStorage for recovery after page refresh
      savePendingSession(newSessionId, userId, startTime);
      
      // Start the global 15-second save interval
      startGlobalSaveInterval();
      
      console.log('[RadioRewards] ✅ Session started:', newSessionId, 'stream:', streamType, 'startTime:', startTime);
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
      console.log('[RadioRewards] 💾 Final save before ending session...');
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
      console.log('[RadioRewards] 🔄 Refreshing balance after session end');
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
        console.log('[RadioRewards] No active session, starting new one');
        startSession();
      }
    } else if (!isPlaying && globalSessionId && !pendingStationSwitchRef.current) {
      console.log('[RadioRewards] Playback stopped, ending session');
      endSession();
    }
    
    // Track current station type for next comparison
    lastStationTypeRef.current = isRadio2Go;
  }, [isPlaying, isRadio2Go, isSwitching, isLoading, userId, startSession, endSession]);
  
  // Handle visibility change - save progress when app goes to background but DON'T end session
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && globalSessionId && globalStartTimeMs) {
        console.log('[RadioRewards] 📱 App hidden, saving progress (NOT ending session)');
        // Just save progress - don't end the session, user might come back
        saveProgressGlobal();
      } else if (document.visibilityState === 'visible' && globalSessionId) {
        console.log('[RadioRewards] 📱 App visible again, session still active:', globalSessionId);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Handle page unload - save progress using fetch with keepalive for reliability
  useEffect(() => {
    const saveWithKeepalive = () => {
      if (!globalSessionId || !globalStartTimeMs || !SUPABASE_URL || !SUPABASE_KEY) {
        return;
      }
      
      const durationSeconds = Math.floor((Date.now() - globalStartTimeMs) / 1000);
      
      if (durationSeconds < 60) {
        console.log('[RadioRewards] 🚨 Duration too short for unload save:', durationSeconds);
        return;
      }
      
      console.log('[RadioRewards] 🚨 Sending keepalive save request:', globalSessionId, 'duration:', durationSeconds);
      
      // Use fetch with keepalive - this includes proper auth headers unlike sendBeacon
      fetch(`${SUPABASE_URL}/rest/v1/rpc/save_session_progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ 
          _session_id: globalSessionId, 
          _duration_seconds: durationSeconds 
        }),
        keepalive: true,
      }).catch(err => {
        console.log('[RadioRewards] Keepalive save failed:', err);
      });
    };
    
    const handleBeforeUnload = () => {
      console.log('[RadioRewards] 🚨 beforeunload event triggered');
      saveWithKeepalive();
    };
    
    const handlePageHide = (event: PageTransitionEvent) => {
      console.log('[RadioRewards] 🚨 pagehide event, persisted:', event.persisted);
      saveWithKeepalive();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);
  
  return {
    sessionSummary,
    showSummary,
    closeSummary,
    showFirstTalerCelebration,
    closeFirstTalerCelebration,
    firstTalerAmount,
    isSessionActive: globalSessionId !== null,
    currentDuration: globalSessionId && globalStartTimeMs ? Math.floor((Date.now() - globalStartTimeMs) / 1000) : 0,
  };
}
