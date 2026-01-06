import { create } from 'zustand';

const STREAM_URL = 'http://uksoutha.streaming.broadcast.radio/radio2go';
const API_URL = 'https://api.broadcast.radio/api/nowplaying/2400';
const ARTWORK_BASE = 'https://api.broadcast.radio';

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
        set({
          nowPlaying: {
            title: np.title || 'Unknown',
            artist: np.artist || 'Unknown Artist',
            artworkUrl: np.artworkUrl ? `${ARTWORK_BASE}${np.artworkUrl}` : null,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch now playing:', error);
    }
  },

  togglePlay: () => {
    const { isPlaying, audio } = get();
    
    let currentAudio = audio;
    if (!currentAudio) {
      currentAudio = new Audio(STREAM_URL);
      currentAudio.volume = 1;
      set({ audio: currentAudio });
    }

    if (isPlaying) {
      currentAudio.pause();
      currentAudio.src = '';
      set({ isPlaying: false });
    } else {
      set({ isLoading: true });
      currentAudio.src = STREAM_URL;
      currentAudio.play()
        .then(() => {
          set({ isPlaying: true, isLoading: false });
          get().fetchNowPlaying();
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
