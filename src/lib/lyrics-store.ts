import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface LyricLine {
  text: string;
  startTime: number; // in seconds
  endTime: number;
  words?: LyricWord[]; // For word-by-word highlighting
}

export interface LyricWord {
  text: string;
  startTime: number;
  endTime: number;
}

export interface SyncedLyrics {
  title: string;
  artist: string;
  lines: LyricLine[];
  duration: number;
}

interface LyricsState {
  currentLyrics: SyncedLyrics | null;
  isLoading: boolean;
  error: string | null;
  currentLineIndex: number;
  currentWordIndex: number;
  isKaraokeModeActive: boolean;
  
  fetchLyrics: (title: string, artist: string) => Promise<void>;
  setCurrentPosition: (timeInSeconds: number) => void;
  toggleKaraokeMode: () => void;
  clearLyrics: () => void;
}

// Mock synced lyrics for demo (in production, these would come from an API)
const DEMO_LYRICS: Record<string, SyncedLyrics> = {
  'default': {
    title: 'Demo Song',
    artist: 'Radio 2Go',
    duration: 180,
    lines: [
      { text: '♪ Willkommen bei Radio 2Go ♪', startTime: 0, endTime: 4 },
      { text: 'Lass die Musik spielen', startTime: 4, endTime: 8 },
      { text: 'Tanz mit uns durch die Nacht', startTime: 8, endTime: 12 },
      { text: 'Fühl den Beat, fühl die Kraft', startTime: 12, endTime: 16 },
      { text: '♪ ♪ ♪', startTime: 16, endTime: 20 },
      { text: 'Zusammen sind wir stark', startTime: 20, endTime: 24 },
      { text: 'Musik verbindet uns', startTime: 24, endTime: 28 },
      { text: 'Von morgens bis in die Nacht', startTime: 28, endTime: 32 },
      { text: '♪ Radio 2Go macht dich frei ♪', startTime: 32, endTime: 36 },
    ]
  }
};

// Generate approximate lyrics timing from plain text
function generateTimedLyrics(plainLyrics: string, duration: number = 180): LyricLine[] {
  const lines = plainLyrics
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.trim());
  
  if (lines.length === 0) return [];
  
  const linesDuration = duration / lines.length;
  
  return lines.map((text, index) => ({
    text,
    startTime: index * linesDuration,
    endTime: (index + 1) * linesDuration
  }));
}

// Fetch lyrics from various sources
async function searchLyrics(title: string, artist: string): Promise<string | null> {
  try {
    // Try using edge function to fetch lyrics
    const { data, error } = await supabase.functions.invoke('fetch-lyrics', {
      body: { title, artist }
    });
    
    if (!error && data?.lyrics) {
      return data.lyrics;
    }
  } catch (e) {
    console.error('Failed to fetch lyrics from API:', e);
  }
  
  return null;
}

export const useLyricsStore = create<LyricsState>((set, get) => ({
  currentLyrics: null,
  isLoading: false,
  error: null,
  currentLineIndex: -1,
  currentWordIndex: -1,
  isKaraokeModeActive: false,
  
  fetchLyrics: async (title: string, artist: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // First try to get from API
      const plainLyrics = await searchLyrics(title, artist);
      
      if (plainLyrics) {
        const timedLyrics = generateTimedLyrics(plainLyrics);
        set({
          currentLyrics: {
            title,
            artist,
            lines: timedLyrics,
            duration: 180 // Default duration
          },
          isLoading: false,
          currentLineIndex: 0
        });
        return;
      }
      
      // Fallback to demo lyrics
      set({
        currentLyrics: DEMO_LYRICS['default'],
        isLoading: false,
        currentLineIndex: 0
      });
    } catch (error) {
      console.error('Lyrics fetch error:', error);
      // Use demo lyrics as fallback
      set({
        currentLyrics: DEMO_LYRICS['default'],
        isLoading: false,
        error: 'Lyrics werden simuliert'
      });
    }
  },
  
  setCurrentPosition: (timeInSeconds: number) => {
    const { currentLyrics } = get();
    if (!currentLyrics) return;
    
    // Find current line based on time
    const lineIndex = currentLyrics.lines.findIndex(
      (line, idx) => {
        const nextLine = currentLyrics.lines[idx + 1];
        return timeInSeconds >= line.startTime && 
               (nextLine ? timeInSeconds < nextLine.startTime : true);
      }
    );
    
    if (lineIndex !== -1 && lineIndex !== get().currentLineIndex) {
      set({ currentLineIndex: lineIndex });
    }
  },
  
  toggleKaraokeMode: () => {
    const { isKaraokeModeActive } = get();
    set({ isKaraokeModeActive: !isKaraokeModeActive });
    
    // Clear lyrics when disabling
    if (isKaraokeModeActive) {
      set({ currentLyrics: null, currentLineIndex: -1 });
    }
  },
  
  clearLyrics: () => {
    set({
      currentLyrics: null,
      currentLineIndex: -1,
      currentWordIndex: -1,
      error: null
    });
  }
}));
