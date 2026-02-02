import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRadioStore } from '@/lib/radio-store';
import { useAuthSafe } from '@/contexts/AuthContext';
import { triggerTalerAnimation } from '@/components/taler/TalerEarnAnimation';
import { toast } from 'sonner';

// Force HMR boundary to prevent React queue corruption during hot reload
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    window.location.reload();
  });
}

const FIRST_TALER_KEY = 'first_taler_celebrated';
const PENDING_SESSION_KEY = 'pending_radio_session';
const AUTH_TOKEN_KEY = 'pending_radio_auth_token';
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
let globalAccessToken: string | null = null;

// CRITICAL: Restore global state from localStorage immediately on module load
// This ensures that after a page refresh, the session continues
function restoreGlobalStateFromStorage() {
  try {
    const data = localStorage.getItem(PENDING_SESSION_KEY);
    if (!data) return;
    
    const parsed = JSON.parse(data);
    if (parsed.sessionId && parsed.startTime) {
      globalSessionId = parsed.sessionId;
      globalStartTimeMs = parsed.startTime;
      globalUserId = parsed.userId || null;
      console.log('[RadioRewards] 🔄 RESTORED global state from localStorage on module load:', globalSessionId);
    }
    
    // Also restore auth token if available
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      globalAccessToken = token;
      console.log('[RadioRewards] 🔄 RESTORED auth token from localStorage');
    }
  } catch (e) {
    console.error('[RadioRewards] Error restoring from localStorage:', e);
  }
}

// Run immediately when module loads
restoreGlobalStateFromStorage();

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

// Save auth token for background saves
function saveAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  globalAccessToken = token;
  console.log('[RadioRewards] 🔐 Saved auth token for background saves');
}

function clearPendingSession() {
  localStorage.removeItem(PENDING_SESSION_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  globalSessionId = null;
  globalStartTimeMs = null;
  globalAccessToken = null;
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

// Get fresh auth token from Supabase
async function getFreshAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      saveAuthToken(session.access_token);
      return session.access_token;
    }
    return globalAccessToken; // Fallback to cached token
  } catch (e) {
    console.error('[RadioRewards] Error getting auth token:', e);
    return globalAccessToken;
  }
}

// Direct RPC call to save progress - GLOBAL function that doesn't rely on React
async function saveProgressGlobal(showFeedback = false): Promise<boolean> {
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
      if (showFeedback) {
        toast.error('Fehler beim Speichern des Fortschritts', {
          description: error.message,
        });
      }
      globalSaveInProgress = false;
      return false;
    } else {
      console.log('[RadioRewards] ✅ Progress saved successfully:', data);
      // Refresh balance if callback is available
      if (globalRefreshBalance) {
        console.log('[RadioRewards] 🔄 Triggering balance refresh...');
        globalRefreshBalance();
      }
      const result = data as { taler_awarded?: number; success?: boolean } | null;
      if (showFeedback && result?.taler_awarded && result.taler_awarded > 0) {
        toast.success(`${result.taler_awarded} Taler gespeichert!`, {
          duration: 2000,
        });
      }
      globalSaveInProgress = false;
      return true;
    }
  } catch (err) {
    console.error('[RadioRewards] ❌ Exception saving progress:', err);
    if (showFeedback) {
      toast.error('Netzwerkfehler beim Speichern');
    }
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
    saveProgressGlobal(true); // Show feedback for first save
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

// Background save with proper auth token - for page unload events
async function saveWithKeepalive() {
  if (!globalSessionId || !globalStartTimeMs || !SUPABASE_URL || !SUPABASE_KEY) {
    return;
  }
  
  const durationSeconds = Math.floor((Date.now() - globalStartTimeMs) / 1000);
  
  if (durationSeconds < 60) {
    console.log('[RadioRewards] 🚨 Duration too short for unload save:', durationSeconds);
    return;
  }
  
  // Get the best auth token we have
  const authToken = globalAccessToken || SUPABASE_KEY;
  
  console.log('[RadioRewards] 🚨 Sending keepalive save request:', globalSessionId, 'duration:', durationSeconds, 'hasUserToken:', !!globalAccessToken);
  
  // Use fetch with keepalive - this includes proper auth headers
  try {
    fetch(`${SUPABASE_URL}/rest/v1/rpc/save_session_progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ 
        _session_id: globalSessionId, 
        _duration_seconds: durationSeconds 
      }),
      keepalive: true,
    }).catch(err => {
      console.log('[RadioRewards] Keepalive save failed:', err);
    });
  } catch (e) {
    console.error('[RadioRewards] Error in keepalive save:', e);
  }
}

export function useRadioRewards() {
  const authContext = useAuthSafe();
  const refreshBalance = authContext?.refreshBalance;
  const clearPendingTaler = authContext?.clearPendingTaler;
  const user = authContext?.user;
  const session = authContext?.session;
  const { isPlaying, isRadio2Go, isSwitching, isLoading } = useRadioStore();
  
  const lastStationTypeRef = useRef<boolean | null>(null);
  const pendingStationSwitchRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const authReadyRef = useRef(false);
  
  const [sessionSummary, setSessionSummary] = useState<SessionSummaryData | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showFirstTalerCelebration, setShowFirstTalerCelebration] = useState(false);
  const [firstTalerAmount, setFirstTalerAmount] = useState(0);
  
  const userId = user?.id;
  
  // Keep global refreshBalance and auth token updated
  useEffect(() => {
    globalRefreshBalance = refreshBalance;
    if (userId) {
      globalUserId = userId;
    }
    
    // CRITICAL: Store the access token for background saves
    if (session?.access_token) {
      saveAuthToken(session.access_token);
      authReadyRef.current = true;
    }
  }, [refreshBalance, userId, session?.access_token]);
  
  // CRITICAL: On mount OR when userId becomes available, check for pending sessions
  // This handles both initial load and delayed auth
  useEffect(() => {
    if (!userId) {
      console.log('[RadioRewards] Waiting for user authentication...');
      return;
    }
    
    // If we already initialized for this user, skip
    if (hasInitializedRef.current && globalUserId === userId) {
      return;
    }
    
    hasInitializedRef.current = true;
    globalUserId = userId;
    
    console.log('[RadioRewards] 🚀 Initializing for user:', userId, 'globalSessionId:', globalSessionId, 'globalStartTimeMs:', globalStartTimeMs);
    
    // Get fresh auth token
    getFreshAuthToken().then(token => {
      console.log('[RadioRewards] Got auth token:', !!token);
    });
    
    // If we already have global state (restored from localStorage on module load), 
    // verify the session is still valid and start the save interval
    if (globalSessionId && globalStartTimeMs) {
      console.log('[RadioRewards] 🔄 Found existing session, verifying on server...');
      
      // Verify session is still active
      supabase
        .from('radio_listening_sessions')
        .select('id, ended_at, user_id')
        .eq('id', globalSessionId)
        .single()
        .then(({ data: sessionData, error }) => {
          if (error || !sessionData || sessionData.ended_at) {
            console.log('[RadioRewards] Session no longer active on server, clearing. Error:', error?.message);
            clearPendingSession();
            return;
          }
          
          // Verify session belongs to current user
          if (sessionData.user_id !== userId) {
            console.log('[RadioRewards] Session belongs to different user, clearing');
            clearPendingSession();
            return;
          }
          
          // Session is valid! Start the save interval
          console.log('[RadioRewards] ✅ Session still active, starting save interval');
          startGlobalSaveInterval();
          
          // Do an immediate save if enough time has passed
          const elapsed = Math.floor((Date.now() - globalStartTimeMs!) / 1000);
          console.log('[RadioRewards] Elapsed since session start:', elapsed, 'seconds');
          
          if (elapsed >= 60) {
            setTimeout(() => {
              console.log('[RadioRewards] 🔄 Immediate save after page reload');
              saveProgressGlobal(true);
            }, 500);
          }
        });
    } else {
      // No active session, check for orphaned sessions
      console.log('[RadioRewards] No active session, checking for orphaned sessions...');
      supabase.rpc('recover_orphaned_sessions', { _user_id: userId })
        .then(({ data, error }) => {
          if (error) {
            console.error('[RadioRewards] Error recovering orphaned sessions:', error);
          } else if (data && typeof data === 'object') {
            const result = data as { recovered_sessions?: number; total_reward?: number };
            if (result.recovered_sessions && result.recovered_sessions > 0) {
              console.log('[RadioRewards] ✅ Recovered orphaned sessions:', result);
              toast.success(`${result.total_reward || 0} Taler wiederhergestellt!`, {
                description: `${result.recovered_sessions} unterbrochene Session(s) wurden abgerechnet.`,
              });
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
    
    // Get fresh auth token before starting
    await getFreshAuthToken();
    
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
        // Refresh auth token when coming back
        getFreshAuthToken();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Handle page unload - save progress using fetch with keepalive for reliability
  useEffect(() => {
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
