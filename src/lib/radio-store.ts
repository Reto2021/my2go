import { create } from 'zustand';

const STREAM_URL = 'http://uksoutha.streaming.broadcast.radio/radio2go';
const API_URL = 'https://api.broadcast.radio/api/nowplaying/2400';
const ARTWORK_BASE = 'https://api.broadcast.radio';
const DEFAULT_ARTWORK = '/pwa-512x512.png';

interface NowPlayingData {
  title: string;
  artist: string;
  artworkUrl: string | null;
}

interface RadioStore {
  isPlaying: boolean;
  isMuted: boolean;
  isLoading: boolean;
  volume: number;
  nowPlaying: NowPlayingData | null;
  audio: HTMLAudioElement | null;
  
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  fetchNowPlaying: () => Promise<void>;
}

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
  audio: null,

  fetchNowPlaying: async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data.success && data.body?.now_playing) {
        const np = data.body.now_playing;
        const nowPlaying = {
          title: np.title || 'Unknown',
          artist: np.artist || 'Unknown Artist',
          artworkUrl: np.artworkUrl ? `${ARTWORK_BASE}${np.artworkUrl}` : null,
        };
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
      currentAudio.volume = 1;
      set({ audio: currentAudio });
      
      // Setup media session handlers once
      setupMediaSessionHandlers(() => get().togglePlay());
    }

    if (isPlaying) {
      currentAudio.pause();
      currentAudio.src = '';
      set({ isPlaying: false });
      updateMediaSession(nowPlaying, false);
    } else {
      set({ isLoading: true });
      currentAudio.src = STREAM_URL;
      currentAudio.play()
        .then(() => {
          set({ isPlaying: true, isLoading: false });
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
