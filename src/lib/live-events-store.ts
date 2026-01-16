import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

/**
 * Live Events Store
 * Manages external live streams (concerts, church services, etc.)
 * that can run alongside the main Radio 2Go stream
 * Now uses Supabase for persistent storage
 */

export type EventType = 'concert' | 'church' | 'party' | 'podcast' | 'dj' | 'talk' | 'special' | 'other';

export interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  streamUrl: string;
  thumbnailUrl: string | null;
  hostName: string | null;
  hostAvatarUrl: string | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  isLive: boolean;
  viewerCount: number;
  peakViewers: number;
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface LiveEventsState {
  events: LiveEvent[];
  currentEvent: LiveEvent | null;
  isEventPlaying: boolean;
  isLoadingEvents: boolean;
  eventVolume: number;
  radioVolume: number;
  hasLiveEvents: boolean;
  
  // Actions
  fetchEvents: () => Promise<void>;
  joinEvent: (eventId: string) => void;
  leaveEvent: () => void;
  setEventVolume: (volume: number) => void;
  crossfadeToEvent: (eventId: string) => void;
  crossfadeToRadio: () => void;
  subscribeToRealtime: () => () => void;
}

// Event type metadata
export const EVENT_TYPES: Record<EventType, { emoji: string; label: string; color: string }> = {
  concert: { emoji: '🎸', label: 'Konzert', color: 'from-orange-500 to-red-500' },
  church: { emoji: '⛪', label: 'Gottesdienst', color: 'from-blue-500 to-purple-500' },
  party: { emoji: '🎉', label: 'Party', color: 'from-pink-500 to-purple-500' },
  podcast: { emoji: '🎙️', label: 'Podcast', color: 'from-green-500 to-teal-500' },
  dj: { emoji: '🎧', label: 'DJ Set', color: 'from-cyan-500 to-blue-500' },
  talk: { emoji: '💬', label: 'Talk', color: 'from-amber-500 to-orange-500' },
  special: { emoji: '✨', label: 'Special', color: 'from-purple-500 to-pink-500' },
  other: { emoji: '📺', label: 'Live', color: 'from-gray-500 to-gray-600' }
};

// Map database row to LiveEvent
function mapDbToLiveEvent(row: any): LiveEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: (row.event_type as EventType) || 'other',
    streamUrl: row.stream_url,
    thumbnailUrl: row.thumbnail_url,
    hostName: row.host_name,
    hostAvatarUrl: row.host_avatar_url,
    scheduledStart: row.scheduled_start ? new Date(row.scheduled_start) : null,
    scheduledEnd: row.scheduled_end ? new Date(row.scheduled_end) : null,
    startedAt: row.started_at ? new Date(row.started_at) : null,
    endedAt: row.ended_at ? new Date(row.ended_at) : null,
    isLive: row.is_live || false,
    viewerCount: row.viewer_count || 0,
    peakViewers: row.peak_viewers || 0,
    tags: row.tags || [],
    isFeatured: row.is_featured || false,
    isActive: row.is_active !== false,
    createdAt: new Date(row.created_at)
  };
}

export const useLiveEventsStore = create<LiveEventsState>((set, get) => ({
  events: [],
  currentEvent: null,
  isEventPlaying: false,
  isLoadingEvents: false,
  eventVolume: 1,
  radioVolume: 1,
  hasLiveEvents: false,
  
  fetchEvents: async () => {
    set({ isLoadingEvents: true });
    
    try {
      const { data, error } = await supabase
        .from('live_events')
        .select('*')
        .eq('is_active', true)
        .order('is_live', { ascending: false })
        .order('scheduled_start', { ascending: true });
      
      if (error) {
        console.error('Failed to fetch live events:', error);
        set({ isLoadingEvents: false, events: [], hasLiveEvents: false });
        return;
      }
      
      const events = (data || []).map(mapDbToLiveEvent);
      const hasLiveEvents = events.some(e => e.isLive);
      
      set({ events, isLoadingEvents: false, hasLiveEvents });
    } catch (error) {
      console.error('Failed to fetch live events:', error);
      set({ isLoadingEvents: false, events: [], hasLiveEvents: false });
    }
  },
  
  subscribeToRealtime: () => {
    const channel = supabase
      .channel('live-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_events'
        },
        () => {
          // Refetch on any change
          get().fetchEvents();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  },
  
  joinEvent: (eventId: string) => {
    const event = get().events.find(e => e.id === eventId);
    if (event) {
      set({ currentEvent: event, isEventPlaying: true });
    }
  },
  
  leaveEvent: () => {
    set({ currentEvent: null, isEventPlaying: false });
  },
  
  setEventVolume: (volume: number) => {
    set({ eventVolume: Math.max(0, Math.min(1, volume)) });
  },
  
  crossfadeToEvent: (eventId: string) => {
    const event = get().events.find(e => e.id === eventId);
    if (!event) return;
    
    set({ currentEvent: event, isEventPlaying: true });
    
    let radioVol = 1;
    let eventVol = 0;
    
    const fadeInterval = setInterval(() => {
      radioVol -= 0.05;
      eventVol += 0.05;
      
      if (radioVol <= 0) {
        clearInterval(fadeInterval);
        set({ radioVolume: 0, eventVolume: 1 });
      } else {
        set({ radioVolume: radioVol, eventVolume: eventVol });
      }
    }, 50);
  },
  
  crossfadeToRadio: () => {
    let radioVol = get().radioVolume;
    let eventVol = get().eventVolume;
    
    const fadeInterval = setInterval(() => {
      radioVol += 0.05;
      eventVol -= 0.05;
      
      if (eventVol <= 0) {
        clearInterval(fadeInterval);
        set({ 
          radioVolume: 1, 
          eventVolume: 0, 
          isEventPlaying: false, 
          currentEvent: null 
        });
      } else {
        set({ radioVolume: radioVol, eventVolume: eventVol });
      }
    }, 50);
  }
}));
