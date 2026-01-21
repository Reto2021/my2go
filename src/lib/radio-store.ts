import { create } from 'zustand';

// Default Radio 2Go stream
const DEFAULT_STREAM_URL = 'https://uksoutha.streaming.broadcast.radio/radio2go';
const API_URL = 'https://api.broadcast.radio/api/nowplaying/2400';
const ARTWORK_BASE = 'https://api.broadcast.radio';
const DEFAULT_ARTWORK = '/pwa-512x512.png';
const ITUNES_SEARCH_API = 'https://itunes.apple.com/search';

// LocalStorage keys for persistence (survives page reloads and navigation)
const LOCAL_STORAGE_KEY = 'radio2go_session';
const RADIO_STATE_KEY = 'radio2go_state';
const CUSTOM_STATION_KEY = 'radio2go_custom_station';
const LAST_EXTERNAL_STATION_KEY = 'radio2go_last_external';

// External station info
export interface ExternalStation {
  uuid: string;
  name: string;
  url: string;
  favicon: string | null;
  country: string;
  tags: string[];
}

interface PersistedSession {
  startTime: string; // ISO string
  celebratedTiers: string[]; // Tier IDs that were already celebrated
}

interface PersistedRadioState {
  wasPlaying: boolean;
  volume: number;
  savedAt: number; // timestamp
}

// Helper functions for custom station persistence
export function saveCustomStation(station: ExternalStation | null) {
  try {
    if (station) {
      localStorage.setItem(CUSTOM_STATION_KEY, JSON.stringify(station));
      // Also save as last external station for quick-switch
      localStorage.setItem(LAST_EXTERNAL_STATION_KEY, JSON.stringify(station));
    } else {
      localStorage.removeItem(CUSTOM_STATION_KEY);
    }
  } catch (e) {
    console.warn('Could not save custom station:', e);
  }
}

export function loadCustomStation(): ExternalStation | null {
  try {
    const stored = localStorage.getItem(CUSTOM_STATION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Could not load custom station:', e);
  }
  return null;
}

// Get last used external station for quick-switch back
export function loadLastExternalStation(): ExternalStation | null {
  try {
    const stored = localStorage.getItem(LAST_EXTERNAL_STATION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Could not load last external station:', e);
  }
  return null;
}

// Helper functions for session persistence (using localStorage for persistence across page reloads)
function saveSessionToStorage(startTime: Date, celebratedTiers: string[] = []) {
  try {
    const session: PersistedSession = {
      startTime: startTime.toISOString(),
      celebratedTiers,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Could not save session to storage:', e);
  }
}

function loadSessionFromStorage(): PersistedSession | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Could not load session from storage:', e);
  }
  return null;
}

function clearSessionFromStorage() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.warn('Could not clear session from storage:', e);
  }
}

export function getCelebratedTiers(): string[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const session: PersistedSession = JSON.parse(stored);
      return session.celebratedTiers || [];
    }
  } catch (e) {
    console.warn('Could not get celebrated tiers:', e);
  }
  return [];
}

export function addCelebratedTier(tierName: string) {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const session: PersistedSession = JSON.parse(stored);
      if (!session.celebratedTiers.includes(tierName)) {
        session.celebratedTiers.push(tierName);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(session));
      }
    }
  } catch (e) {
    console.warn('Could not add celebrated tier:', e);
  }
}

// Helper functions for radio state persistence (for auto-resume after login)
export function saveRadioState(wasPlaying: boolean, volume: number) {
  try {
    const state: PersistedRadioState = {
      wasPlaying,
      volume,
      savedAt: Date.now(),
    };
    localStorage.setItem(RADIO_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save radio state:', e);
  }
}

export function loadRadioState(): PersistedRadioState | null {
  try {
    const stored = localStorage.getItem(RADIO_STATE_KEY);
    if (stored) {
      const state: PersistedRadioState = JSON.parse(stored);
      // Only restore if saved within last 5 minutes (user was navigating to login)
      if (Date.now() - state.savedAt < 5 * 60 * 1000) {
        return state;
      }
      // Clear stale state
      localStorage.removeItem(RADIO_STATE_KEY);
    }
  } catch (e) {
    console.warn('Could not load radio state:', e);
  }
  return null;
}

export function clearRadioState() {
  try {
    localStorage.removeItem(RADIO_STATE_KEY);
  } catch (e) {
    console.warn('Could not clear radio state:', e);
  }
}

interface NowPlayingData {
  title: string;
  artist: string;
  artworkUrl: string | null;
  videoUrl: string | null;
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
  isPlayerExpanded: boolean;
  isPlayerMinimized: boolean;
  
  // Custom station support
  customStation: ExternalStation | null;
  isRadio2Go: boolean; // true = Radio 2Go (full rewards), false = external (50% rewards)
  lastExternalStation: ExternalStation | null; // Last used external station for quick-switch
  
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  fetchNowPlaying: () => Promise<void>;
  updateSessionDuration: () => void;
  setPlayerExpanded: (expanded: boolean) => void;
  setPlayerMinimized: (minimized: boolean) => void;
  restoreSession: () => boolean; // Returns true if session was restored
  saveStateForNavigation: () => void; // Save state before navigating away
  autoResumeIfNeeded: () => void; // Resume playback if navigated back
  
  // Custom station methods
  setCustomStation: (station: ExternalStation | null) => void;
  getStreamUrl: () => string;
  getStationName: () => string;
  getLastExternalStation: () => ExternalStation | null;
}

interface iTunesMediaResult {
  artworkUrl: string | null;
  videoUrl: string | null;
}

// Fetch artwork and video from iTunes as fallback
const fetchITunesMedia = async (title: string, artist: string): Promise<iTunesMediaResult> => {
  try {
    const query = encodeURIComponent(`${artist} ${title}`);
    // First try to find a music video
    const videoResponse = await fetch(`${ITUNES_SEARCH_API}?term=${query}&media=musicVideo&limit=1`);
    const videoData = await videoResponse.json();
    
    let videoUrl: string | null = null;
    let artworkUrl: string | null = null;
    
    if (videoData.results && videoData.results.length > 0) {
      const result = videoData.results[0];
      videoUrl = result.previewUrl || null;
      artworkUrl = result.artworkUrl100?.replace('100x100', '600x600') || null;
    }
    
    // If no video found, try music for artwork
    if (!artworkUrl) {
      const musicResponse = await fetch(`${ITUNES_SEARCH_API}?term=${query}&media=music&limit=1`);
      const musicData = await musicResponse.json();
      if (musicData.results && musicData.results.length > 0) {
        artworkUrl = musicData.results[0].artworkUrl100?.replace('100x100', '600x600') || null;
      }
    }
    
    return { artworkUrl, videoUrl };
  } catch (error) {
    console.error('iTunes media fetch failed:', error);
  }
  return { artworkUrl: null, videoUrl: null };
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
  isPlayerExpanded: false,
  isPlayerMinimized: false,
  
  // Custom station support - load from localStorage on init
  customStation: loadCustomStation(),
  isRadio2Go: loadCustomStation() === null,
  lastExternalStation: loadLastExternalStation(),

  setPlayerExpanded: (expanded: boolean) => set({ isPlayerExpanded: expanded }),
  setPlayerMinimized: (minimized: boolean) => set({ isPlayerMinimized: minimized }),

  // Custom station methods
  setCustomStation: (station: ExternalStation | null) => {
    saveCustomStation(station);
    // If switching to external station, update lastExternalStation
    if (station) {
      set({ lastExternalStation: station });
    }
    set({ 
      customStation: station, 
      isRadio2Go: station === null,
      // Reset now playing when switching stations
      nowPlaying: station ? { 
        title: station.name, 
        artist: 'Live Stream', 
        artworkUrl: station.favicon,
        videoUrl: null,
      } : null,
    });
  },
  
  getStreamUrl: () => {
    const { customStation } = get();
    return customStation?.url || DEFAULT_STREAM_URL;
  },
  
  getStationName: () => {
    const { customStation } = get();
    return customStation?.name || 'Radio 2Go';
  },
  
  getLastExternalStation: () => {
    return get().lastExternalStation || loadLastExternalStation();
  },

  updateSessionDuration: () => {
    const { sessionStartTime, isPlaying } = get();
    if (isPlaying && sessionStartTime) {
      const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
      set({ currentSessionDuration: duration });
    }
  },

  fetchNowPlaying: async () => {
    const { isRadio2Go, customStation } = get();
    
    // For external stations, we don't have metadata API
    if (!isRadio2Go && customStation) {
      set({ 
        nowPlaying: {
          title: customStation.name,
          artist: 'Live Stream',
          artworkUrl: customStation.favicon,
          videoUrl: null,
        }
      });
      return;
    }
    
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data.success && data.body?.now_playing) {
        const np = data.body.now_playing;
        const title = np.title || 'Unknown';
        const artist = np.artist || 'Unknown Artist';
        let artworkUrl = np.artworkUrl ? `${ARTWORK_BASE}${np.artworkUrl}` : null;
        let videoUrl: string | null = null;
        
        // Only try iTunes for artwork and video if we have real title and artist
        const hasRealMetadata = title !== 'Unknown' && artist !== 'Unknown Artist' && 
                                 !title.toLowerCase().includes('unknown') && 
                                 !artist.toLowerCase().includes('unknown');
        
        if (hasRealMetadata) {
          const iTunesMedia = await fetchITunesMedia(title, artist);
          if (!artworkUrl && iTunesMedia.artworkUrl) {
            artworkUrl = iTunesMedia.artworkUrl;
          }
          videoUrl = iTunesMedia.videoUrl;
        }
        
        const nowPlaying = { title, artist, artworkUrl, videoUrl };
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

  restoreSession: () => {
    const stored = loadSessionFromStorage();
    if (stored) {
      const startTime = new Date(stored.startTime);
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      
      // Only restore if session is less than 2 hours old
      if (elapsed < 7200) {
        set({ sessionStartTime: startTime, currentSessionDuration: elapsed });
        return true;
      } else {
        clearSessionFromStorage();
      }
    }
    return false;
  },

  togglePlay: () => {
    const { isPlaying, isLoading, audio, nowPlaying, getStreamUrl } = get();
    
    // Prevent multiple clicks while loading
    if (isLoading) return;
    
    // Stop any existing audio first to prevent duplicates
    if (audio && !isPlaying) {
      audio.pause();
      audio.src = '';
    }
    
    let currentAudio = audio;
    if (!currentAudio) {
      currentAudio = new Audio();
      currentAudio.volume = get().volume;
      // iOS requires preload attribute for better autoplay handling
      currentAudio.preload = 'auto';
      
      // Add error handler for stream recovery
      currentAudio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        const { isPlaying } = get();
        if (isPlaying) {
          // Try to recover by reloading stream after a short delay
          setTimeout(() => {
            const { audio, isPlaying, getStreamUrl } = get();
            if (audio && isPlaying) {
              console.log('Attempting stream recovery...');
              audio.src = getStreamUrl();
              audio.play().catch(err => {
                console.error('Recovery failed:', err);
                set({ isPlaying: false, isLoading: false });
              });
            }
          }, 2000);
        }
      });
      
      // Handle stream stall/waiting (buffering)
      currentAudio.addEventListener('waiting', () => {
        console.log('Stream buffering...');
      });
      
      // Handle stream ended unexpectedly
      currentAudio.addEventListener('ended', () => {
        console.log('Stream ended, attempting restart...');
        const { isPlaying, getStreamUrl } = get();
        if (isPlaying) {
          const audio = get().audio;
          if (audio) {
            audio.src = getStreamUrl();
            audio.play().catch(err => console.error('Restart failed:', err));
          }
        }
      });
      
      // Handle pause event (might be triggered by iOS when switching apps or external controls)
      // We need to be careful not to sync state when the pause is intentional (e.g., togglePlay)
      currentAudio.addEventListener('pause', () => {
        const { isPlaying, isLoading } = get();
        // Only sync state if we think we should still be playing but audio is paused
        // This handles cases like iOS background restrictions or external media controls
        if (isPlaying && !isLoading) {
          console.log('Pause event detected - checking if sync needed');
          // Longer delay to avoid race conditions with navigation and manual togglePlay
          // This gives time for intentional pauses to update state first
          setTimeout(() => {
            const audio = get().audio;
            const currentIsPlaying = get().isPlaying;
            const currentIsLoading = get().isLoading;
            // Only update if audio is actually paused AND we still think we're playing
            // AND we're not in a loading state (which could indicate a restart)
            if (audio && audio.paused && currentIsPlaying && !currentIsLoading) {
              // Double check that the audio source is still set (not cleared intentionally)
              if (audio.src && audio.src !== '') {
                console.log('Syncing isPlaying state to false due to unexpected pause');
                set({ isPlaying: false });
              }
            }
          }, 200);
        }
      });
      
      set({ audio: currentAudio });
      
      // Setup media session handlers once
      setupMediaSessionHandlers(() => get().togglePlay());
    }

    if (isPlaying) {
      currentAudio.pause();
      currentAudio.src = '';
      clearSessionFromStorage();
      set({ isPlaying: false, sessionStartTime: null, currentSessionDuration: 0 });
      updateMediaSession(nowPlaying, false);
    } else {
      set({ isLoading: true });
      
      // iOS Safari Autoplay Fix:
      // Set src and immediately call play() in the same synchronous user gesture stack.
      // Do NOT call load() separately - it breaks the user gesture chain on iOS.
      currentAudio.pause();
      currentAudio.src = getStreamUrl();
      
      // Immediately attempt play - this preserves the user gesture context on iOS
      const playPromise = currentAudio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Try to restore previous session first
            const restored = get().restoreSession();
            
            if (!restored) {
              // Start fresh session
              const startTime = new Date();
              saveSessionToStorage(startTime, []);
              set({ sessionStartTime: startTime, currentSessionDuration: 0 });
            }
            
            set({ isPlaying: true, isLoading: false });
            get().fetchNowPlaying();
            updateMediaSession(get().nowPlaying, true);
          })
          .catch((err) => {
            console.error('Playback failed:', err);
            set({ isLoading: false });
            
            // On iOS, if autoplay fails, the user needs to tap again
            // We could show a toast here to prompt the user
          });
      }
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

  saveStateForNavigation: () => {
    const { isPlaying, volume } = get();
    if (isPlaying) {
      saveRadioState(true, volume);
    }
  },

  autoResumeIfNeeded: () => {
    const state = loadRadioState();
    if (state && state.wasPlaying) {
      clearRadioState();
      // Set volume first, then trigger play
      set({ volume: state.volume });
      // Small delay to ensure component is mounted
      setTimeout(() => {
        const { isPlaying, togglePlay } = get();
        if (!isPlaying) {
          togglePlay();
        }
      }, 500);
    }
  },
}));
