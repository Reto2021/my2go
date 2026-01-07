import { create } from 'zustand';

const STREAM_URL = 'http://uksoutha.streaming.broadcast.radio/radio2go';

// Chromecast types
declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: {
      framework: {
        CastContext: {
          getInstance: () => CastContext;
        };
        CastContextEventType: {
          SESSION_STATE_CHANGED: string;
        };
        SessionState: {
          SESSION_STARTED: string;
          SESSION_RESUMED: string;
          SESSION_ENDED: string;
        };
        RemotePlayerEventType: {
          IS_CONNECTED_CHANGED: string;
          IS_PAUSED_CHANGED: string;
        };
        RemotePlayer: new () => RemotePlayer;
        RemotePlayerController: new (player: RemotePlayer) => RemotePlayerController;
      };
    };
    chrome?: {
      cast: {
        media: {
          MediaInfo: new (contentId: string, contentType: string) => MediaInfo;
          GenericMediaMetadata: new () => GenericMediaMetadata;
          LoadRequest: new (mediaInfo: MediaInfo) => LoadRequest;
        };
        AutoJoinPolicy: {
          ORIGIN_SCOPED: string;
        };
      };
    };
  }
}

interface CastContext {
  setOptions: (options: { receiverApplicationId: string; autoJoinPolicy: string }) => void;
  addEventListener: (event: string, callback: (event: any) => void) => void;
  removeEventListener: (event: string, callback: (event: any) => void) => void;
  getCurrentSession: () => CastSession | null;
  requestSession: () => Promise<void>;
}

interface CastSession {
  loadMedia: (request: LoadRequest) => Promise<void>;
  endSession: (stopCasting: boolean) => void;
}

interface MediaInfo {
  metadata: GenericMediaMetadata;
  streamType: string;
}

interface GenericMediaMetadata {
  title: string;
  subtitle: string;
  images: Array<{ url: string }>;
}

interface LoadRequest {
  autoplay: boolean;
}

interface RemotePlayer {
  isConnected: boolean;
  isPaused: boolean;
}

interface RemotePlayerController {
  addEventListener: (event: string, callback: () => void) => void;
  removeEventListener: (event: string, callback: () => void) => void;
  playOrPause: () => void;
  stop: () => void;
}

interface CastStore {
  isCastAvailable: boolean;
  isCasting: boolean;
  isAirPlayAvailable: boolean;
  castDeviceName: string | null;
  
  initializeCast: () => void;
  startCasting: () => Promise<void>;
  stopCasting: () => void;
  checkAirPlayAvailability: () => void;
}

const setupCastContext = () => {
  if (!window.cast?.framework || !window.chrome?.cast) return;

  const context = window.cast.framework.CastContext.getInstance();
  
  context.setOptions({
    receiverApplicationId: 'CC1AD845', // Default Media Receiver
    autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
  });

  useCastStore.setState({ isCastAvailable: true });

  context.addEventListener(
    window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
    (event: any) => {
      const sessionState = event.sessionState;
      const framework = window.cast!.framework;
      
      if (sessionState === framework.SessionState.SESSION_STARTED ||
          sessionState === framework.SessionState.SESSION_RESUMED) {
        useCastStore.setState({ isCasting: true, castDeviceName: 'Chromecast' });
      } else if (sessionState === framework.SessionState.SESSION_ENDED) {
        useCastStore.setState({ isCasting: false, castDeviceName: null });
      }
    }
  );
};

export const useCastStore = create<CastStore>((set, get) => ({
  isCastAvailable: false,
  isCasting: false,
  isAirPlayAvailable: false,
  castDeviceName: null,

  initializeCast: () => {
    // Check if Cast SDK is already loaded
    if (window.cast?.framework) {
      setupCastContext();
      return;
    }

    // Wait for Cast SDK to load
    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      if (isAvailable && window.cast?.framework) {
        setupCastContext();
      }
    };

    // Load Cast SDK if not already loaded
    if (!document.getElementById('cast-sdk')) {
      const script = document.createElement('script');
      script.id = 'cast-sdk';
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.async = true;
      document.head.appendChild(script);
    }
  },

  startCasting: async () => {
    if (!window.cast?.framework || !window.chrome?.cast) {
      console.error('Cast SDK not available');
      return;
    }

    try {
      const context = window.cast.framework.CastContext.getInstance();
      await context.requestSession();
      
      const session = context.getCurrentSession();
      if (!session) return;

      const mediaInfo = new window.chrome.cast.media.MediaInfo(STREAM_URL, 'audio/mpeg');
      mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = 'Radio 2Go';
      mediaInfo.metadata.subtitle = 'Live Stream';
      mediaInfo.metadata.images = [{ url: 'https://radio2go.ch/logo.png' }];
      (mediaInfo as any).streamType = 'LIVE';

      const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
      request.autoplay = true;

      await session.loadMedia(request);
      set({ isCasting: true });
    } catch (error) {
      console.error('Failed to start casting:', error);
    }
  },

  stopCasting: () => {
    if (!window.cast?.framework) return;

    const context = window.cast.framework.CastContext.getInstance();
    const session = context.getCurrentSession();
    
    if (session) {
      session.endSession(true);
    }
    
    set({ isCasting: false, castDeviceName: null });
  },

  checkAirPlayAvailability: () => {
    // AirPlay is available on Safari/WebKit browsers
    const isAppleDevice = /Mac|iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    set({ isAirPlayAvailable: isAppleDevice || isSafari });
  },
}));
