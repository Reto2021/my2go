import { create } from 'zustand';

/**
 * Live Events Store
 * Manages external live streams (concerts, church services, etc.)
 * that can run alongside the main Radio 2Go stream
 */

export type EventType = 'concert' | 'church' | 'party' | 'podcast' | 'dj-set' | 'other';

export interface LiveEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  streamUrl: string; // HLS, RTMP, or WebRTC URL
  thumbnailUrl?: string;
  hostName: string;
  hostAvatarUrl?: string;
  startTime: Date;
  endTime?: Date;
  isLive: boolean;
  viewerCount: number;
  category: string;
  tags: string[];
  isFeatured: boolean;
}

export interface LiveEventsState {
  events: LiveEvent[];
  currentEvent: LiveEvent | null;
  isEventPlaying: boolean;
  isLoadingEvents: boolean;
  eventVolume: number;
  radioVolume: number; // For crossfade control
  
  // Actions
  fetchEvents: () => Promise<void>;
  joinEvent: (eventId: string) => void;
  leaveEvent: () => void;
  setEventVolume: (volume: number) => void;
  crossfadeToEvent: (eventId: string) => void;
  crossfadeToRadio: () => void;
}

// Event type metadata
export const EVENT_TYPES: Record<EventType, { emoji: string; label: string; color: string }> = {
  concert: { emoji: '🎸', label: 'Konzert', color: 'from-orange-500 to-red-500' },
  church: { emoji: '⛪', label: 'Gottesdienst', color: 'from-blue-500 to-purple-500' },
  party: { emoji: '🎉', label: 'Party', color: 'from-pink-500 to-purple-500' },
  podcast: { emoji: '🎙️', label: 'Podcast', color: 'from-green-500 to-teal-500' },
  'dj-set': { emoji: '🎧', label: 'DJ Set', color: 'from-cyan-500 to-blue-500' },
  other: { emoji: '📺', label: 'Live', color: 'from-gray-500 to-gray-600' }
};

// Mock events for development
const MOCK_EVENTS: LiveEvent[] = [
  {
    id: 'event-1',
    title: 'Sonntagskonzert',
    description: 'Live-Übertragung aus der Konzerthalle',
    type: 'concert',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    hostName: 'Konzerthalle Berlin',
    startTime: new Date(),
    isLive: true,
    viewerCount: 234,
    category: 'Musik',
    tags: ['klassik', 'orchester'],
    isFeatured: true
  },
  {
    id: 'event-2',
    title: 'Abendgottesdienst',
    description: 'Livestream aus der Stadtkirche',
    type: 'church',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    hostName: 'Stadtkirche Köln',
    startTime: new Date(),
    isLive: true,
    viewerCount: 89,
    category: 'Kirche',
    tags: ['gottesdienst', 'gemeinde'],
    isFeatured: false
  }
];

export const useLiveEventsStore = create<LiveEventsState>((set, get) => ({
  events: [],
  currentEvent: null,
  isEventPlaying: false,
  isLoadingEvents: false,
  eventVolume: 1,
  radioVolume: 1,
  
  fetchEvents: async () => {
    set({ isLoadingEvents: true });
    
    try {
      // In production, this would fetch from Supabase or external API
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set({ events: MOCK_EVENTS, isLoadingEvents: false });
    } catch (error) {
      console.error('Failed to fetch live events:', error);
      set({ isLoadingEvents: false });
    }
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
    
    // Start crossfade animation
    set({ currentEvent: event, isEventPlaying: true });
    
    // Gradually decrease radio volume, increase event volume
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
    }, 50); // 50ms intervals for smooth fade (1 second total)
  },
  
  crossfadeToRadio: () => {
    // Gradually decrease event volume, increase radio volume
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
