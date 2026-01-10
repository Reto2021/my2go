import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRadioStore } from '@/lib/radio-store';

interface ListenerPresence {
  count: number;
  isConnected: boolean;
}

export function useLiveListeners(): ListenerPresence {
  const { user } = useAuth();
  const { isPlaying } = useRadioStore();
  const [count, setCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase.channel('live-listeners', {
      config: {
        presence: {
          key: user?.id || `anon-${Math.random().toString(36).substr(2, 9)}`,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const listenerCount = Object.keys(state).length;
        setCount(listenerCount);
        setIsConnected(true);
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence when playing
          if (isPlaying) {
            await channel.track({
              user_id: user?.id,
              listening: true,
              joined_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  // Update presence based on playing state
  useEffect(() => {
    const updatePresence = async () => {
      const channel = supabase.channel('live-listeners');
      if (isPlaying) {
        await channel.track({
          user_id: user?.id,
          listening: true,
          joined_at: new Date().toISOString(),
        });
      } else {
        await channel.untrack();
      }
    };

    if (isConnected) {
      updatePresence();
    }
  }, [isPlaying, isConnected, user?.id]);

  return { count, isConnected };
}
