import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Participant {
  identity: string;
  name: string;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  isMuted: boolean;
  isVideoOff: boolean;
}

export interface UseLiveKitRoomReturn {
  isConnected: boolean;
  isConnecting: boolean;
  participants: Participant[];
  localParticipant: Participant | null;
  error: string | null;
  connect: (roomName: string) => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
}

export const useLiveKitRoom = (): UseLiveKitRoomReturn => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const roomNameRef = useRef<string>('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const getToken = async (roomName: string): Promise<{ token: string; url: string; participantName: string } | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('livekit-token', {
        body: { roomName }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (err) {
      console.error('[useLiveKitRoom] Token error:', err);
      setError('Konnte Token nicht abrufen');
      return null;
    }
  };

  const setupLocalMedia = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0] || null;
      const audioTrack = stream.getAudioTracks()[0] || null;

      return stream;
    } catch (err) {
      console.error('[useLiveKitRoom] Media error:', err);
      setError('Kamera/Mikrofon Zugriff verweigert');
      return null;
    }
  };

  const connect = useCallback(async (roomName: string) => {
    if (!user) {
      toast.error('Bitte zuerst einloggen');
      return;
    }

    setIsConnecting(true);
    setError(null);
    roomNameRef.current = roomName;

    try {
      console.log('[useLiveKitRoom] Connecting to room:', roomName);

      // Get token
      const tokenData = await getToken(roomName);
      if (!tokenData) {
        setIsConnecting(false);
        return;
      }

      // Setup local media
      const localStream = await setupLocalMedia();
      if (!localStream) {
        setIsConnecting(false);
        return;
      }

      // Set local participant
      const videoTrack = localStream.getVideoTracks()[0] || null;
      const audioTrack = localStream.getAudioTracks()[0] || null;

      setLocalParticipant({
        identity: user.id,
        name: tokenData.participantName,
        videoTrack,
        audioTrack,
        isMuted: false,
        isVideoOff: false
      });

      // Connect to LiveKit via WebSocket
      // Note: For a full implementation, you'd use the LiveKit JS SDK
      // This is a simplified version using Supabase Realtime for signaling
      
      const channel = supabase.channel(`dance-party:${roomName}`, {
        config: {
          presence: { key: user.id }
        }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          console.log('[useLiveKitRoom] Presence sync:', state);
          
          const otherParticipants: Participant[] = [];
          Object.entries(state).forEach(([key, presences]) => {
            if (key !== user.id && presences.length > 0) {
              const presence = presences[0] as any;
              otherParticipants.push({
                identity: key,
                name: presence.name || 'Dancer',
                videoTrack: null,
                audioTrack: null,
                isMuted: presence.isMuted || false,
                isVideoOff: presence.isVideoOff || false
              });
            }
          });
          setParticipants(otherParticipants);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('[useLiveKitRoom] Join:', key, newPresences);
          toast.success(`${(newPresences[0] as any)?.name || 'Someone'} ist beigetreten! 🎉`);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('[useLiveKitRoom] Leave:', key, leftPresences);
          toast.info(`${(leftPresences[0] as any)?.name || 'Someone'} hat den Raum verlassen`);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              name: tokenData.participantName,
              joinedAt: new Date().toISOString(),
              isMuted: false,
              isVideoOff: false
            });
            
            setIsConnected(true);
            setIsConnecting(false);
            toast.success('Dance Party beigetreten! 🕺💃');
          }
        });

      wsRef.current = channel as any;

    } catch (err) {
      console.error('[useLiveKitRoom] Connect error:', err);
      setError('Verbindung fehlgeschlagen');
      setIsConnecting(false);
    }
  }, [user]);

  const disconnect = useCallback(() => {
    console.log('[useLiveKitRoom] Disconnecting');

    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();

    // Unsubscribe from channel
    if (wsRef.current) {
      supabase.removeChannel(wsRef.current as any);
      wsRef.current = null;
    }

    setIsConnected(false);
    setParticipants([]);
    setLocalParticipant(null);
    setIsMuted(false);
    setIsVideoOff(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);

        // Update presence
        if (wsRef.current) {
          const channel = wsRef.current as any;
          channel.track({
            isMuted: !audioTrack.enabled
          });
        }
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);

        // Update presence
        if (wsRef.current) {
          const channel = wsRef.current as any;
          channel.track({
            isVideoOff: !videoTrack.enabled
          });
        }
      }
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    participants,
    localParticipant,
    error,
    connect,
    disconnect,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff
  };
};
