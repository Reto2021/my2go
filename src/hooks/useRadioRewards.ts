import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRadioStore } from '@/lib/radio-store';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/lib/session';
import { Json } from '@/integrations/supabase/types';

interface ListeningReward {
  success: boolean;
  duration: number;
  reward: number;
  tier?: string;
  message: string;
}

export function useRadioRewards() {
  const { refreshBalance } = useSession();
  const { isPlaying } = useRadioStore();
  const { toast } = useToast();
  
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Get user ID from Supabase auth
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });
    
    return () => subscription.unsubscribe();
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
        toast({
          title: `🎧 ${result.tier || 'Hörbonus'}!`,
          description: result.message,
        });
        
        // Refresh balance to show new Taler
        refreshBalance?.();
      }
      
      sessionIdRef.current = null;
      startTimeRef.current = null;
    } catch (error) {
      console.error('Error ending listening session:', error);
    }
  }, [toast, refreshBalance]);
  
  // Track play/pause state changes
  useEffect(() => {
    if (!userId) return;
    
    if (isPlaying) {
      startSession();
    } else if (sessionIdRef.current) {
      endSession();
    }
    
    // Cleanup on unmount
    return () => {
      if (sessionIdRef.current) {
        endSession();
      }
    };
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
  };
}
