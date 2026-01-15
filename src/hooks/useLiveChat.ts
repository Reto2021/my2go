import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useLiveChat(songIdentifier: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(1);

  // Fetch messages for current song (last 2 hours)
  const fetchMessages = useCallback(async () => {
    if (!songIdentifier) return;
    
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('live_chat_messages')
      .select('*')
      .eq('song_identifier', songIdentifier)
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }
    
    // Fetch profiles for messages
    const userIds = [...new Set(data?.map(m => m.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    setMessages(
      (data || []).map(m => ({
        ...m,
        profile: profileMap.get(m.user_id)
      }))
    );
    setIsLoading(false);
  }, [songIdentifier]);

  // Send a message
  const sendMessage = useCallback(async (message: string) => {
    if (!user || !songIdentifier || !message.trim()) return false;
    
    const { error } = await supabase
      .from('live_chat_messages')
      .insert({
        user_id: user.id,
        song_identifier: songIdentifier,
        message: message.trim()
      });
    
    if (error) {
      console.error('Error sending message:', error);
      return false;
    }
    
    return true;
  }, [user, songIdentifier]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!songIdentifier) return;
    
    fetchMessages();
    
    const channel = supabase
      .channel(`chat-${songIdentifier}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `song_identifier=eq.${songIdentifier}`
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Fetch profile for new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .eq('id', newMessage.user_id)
            .single();
          
          setMessages(prev => [...prev, { ...newMessage, profile }]);
        }
      )
      .subscribe();

    // Presence for online count
    const presenceChannel = supabase.channel(`presence-${songIdentifier}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineCount(Object.keys(state).length || 1);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          await presenceChannel.track({ user_id: user.id });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [songIdentifier, fetchMessages, user]);

  return {
    messages,
    isLoading,
    sendMessage,
    onlineCount
  };
}
