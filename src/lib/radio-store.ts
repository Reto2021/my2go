import { create } from 'zustand';

const STREAM_URL = 'http://uksoutha.streaming.broadcast.radio/radio2go';
const API_URL = 'https://api.broadcast.radio/api/nowplaying/2400';
const ARTWORK_BASE = 'https://api.broadcast.radio';
const DEFAULT_ARTWORK = '/pwa-512x512.png';
const ITUNES_SEARCH_API = 'https://itunes.apple.com/search';

interface NowPlayingData {
  title: string;
  artist: string;
  artworkUrl: string | null;
}

export interface SongHistoryItem {
  title: string;
  artist: string;
  artworkUrl: string | null;
  playedAt: string;
}

interface RadioStore {
  isPlaying: boolean;
  isMuted: boolean;
  isLoading: boolean;
  volume: number;
  nowPlaying: NowPlayingData | null;
  songHistory: SongHistoryItem[];
  audio: HTMLAudioElement | null;
  sessionStartTime: Date | null;
  currentSessionDuration: number;
  
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  fetchNowPlaying: () => Promise<void>;
  updateSessionDuration: () => void;
}

// Fetch artwork from iTunes as fallback
const fetchITunesArtwork = async (title: string, artist: string): Promise<string | null> => {
  try {
    const query = encodeURIComponent(`${artist} ${title}`);
    const response = await fetch(`${ITUNES_SEARCH_API}?term=${query}&media=music&limit=1`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      // Get high-res artwork (replace 100x100 with 600x600)
      return data.results[0].artworkUrl100?.replace('100x100', '600x600') || null;
    }
  } catch (error) {
    console.error('iTunes artwork fetch failed:', error);
  }
  return null;
};

// Update Media Session API for lock screen controls
const updateMediaSession = (nowPlaying: NowPlayingData | null, isPlaying: boolean) => {
  if (!('mediaSession' in navigator)) return;
  
  const artwork = nowPlaying?.artworkUrl || DEFAULT_ARTWORK;
  
  navigator.mediaSession.metadata = new MediaMetadata({
    title: nowPlaying?.title || 'Radio 2Go',
    artist: nowPlaying?.artist || 'Live Stream',
    album: 'Radio 2Go',
    artwork: [
      { src: artwork, sizes: '96x96', type: 'image/png' },
      { src: artwork, sizes: '128x128', type: 'image/png' },
      { src: artwork, sizes: '192x192', type: 'image/png' },
      { src: artwork, sizes: '256x256', type: 'image/png' },
      { src: artwork, sizes: '384x384', type: 'image/png' },
      { src: artwork, sizes: '512x512', type: 'image/png' },
    ],
  });
  
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
};

// Setup Media Session action handlers
const setupMediaSessionHandlers = (togglePlay: () => void) => {
  if (!('mediaSession' in navigator)) return;
  
  navigator.mediaSession.setActionHandler('play', togglePlay);
  navigator.mediaSession.setActionHandler('pause', togglePlay);
  navigator.mediaSession.setActionHandler('stop', togglePlay);
};

export const useRadioStore = create<RadioStore>((set, get) => ({
  isPlaying: false,
  isMuted: false,
  isLoading: false,
  volume: 1,
  nowPlaying: null,
  songHistory: [],
  audio: null,
  sessionStartTime: null,
  currentSessionDuration: 0,

  updateSessionDuration: () => {
    const { sessionStartTime, isPlaying } = get();
    if (isPlaying && sessionStartTime) {
      const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
      set({ currentSessionDuration: duration });
    }
  },

  fetchNowPlaying: async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data.success && data.body?.now_playing) {
        const np = data.body.now_playing;
        const title = np.title || 'Unknown';
        const artist = np.artist || 'Unknown Artist';
        let artworkUrl = np.artworkUrl ? `${ARTWORK_BASE}${np.artworkUrl}` : null;
        
        // Try iTunes fallback if no artwork from API
        if (!artworkUrl && title && artist) {
          artworkUrl = await fetchITunesArtwork(title, artist);
        }
        
        const nowPlaying = { title, artist, artworkUrl };
        const currentNowPlaying = get().nowPlaying;
        
        // Add to history if song changed
        if (currentNowPlaying && 
            (currentNowPlaying.title !== title || currentNowPlaying.artist !== artist)) {
          const history = get().songHistory;
          const newHistoryItem: SongHistoryItem = {
            ...currentNowPlaying,
            playedAt: new Date().toISOString()
          };
          // Keep only last 10 songs, avoid duplicates
          const updatedHistory = [newHistoryItem, ...history.filter(
            h => !(h.title === currentNowPlaying.title && h.artist === currentNowPlaying.artist)
          )].slice(0, 10);
          set({ songHistory: updatedHistory });
        }
        
        set({ nowPlaying });
        updateMediaSession(nowPlaying, get().isPlaying);
      }
    } catch (error) {
      console.error('Failed to fetch now playing:', error);
    }
  },

  togglePlay: () => {
    const { isPlaying, audio, nowPlaying } = get();
    
    let currentAudio = audio;
    if (!currentAudio) {
      currentAudio = new Audio(STREAM_URL);
      currentAudio.volume = get().volume;
      set({ audio: currentAudio });
      
      // Setup media session handlers once
      setupMediaSessionHandlers(() => get().togglePlay());
    }

    if (isPlaying) {
      currentAudio.pause();
      currentAudio.src = '';
      set({ isPlaying: false, sessionStartTime: null, currentSessionDuration: 0 });
      updateMediaSession(nowPlaying, false);
    } else {
      set({ isLoading: true });
      currentAudio.src = STREAM_URL;
      currentAudio.play()
        .then(() => {
          set({ isPlaying: true, isLoading: false, sessionStartTime: new Date(), currentSessionDuration: 0 });
          get().fetchNowPlaying();
          updateMediaSession(get().nowPlaying, true);
        })
        .catch((err) => {
          console.error('Playback failed:', err);
          set({ isLoading: false });
        });
    }
  },

  toggleMute: () => {
    const { audio, isMuted } = get();
    if (audio) {
      audio.muted = !isMuted;
      set({ isMuted: !isMuted });
    }
  },

  setVolume: (volume: number) => {
    const { audio } = get();
    if (audio) {
      audio.volume = volume;
    }
    set({ volume, isMuted: volume === 0 });
  },
}));
