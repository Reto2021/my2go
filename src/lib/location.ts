import { create } from 'zustand';

const LOCATION_GRANTED_KEY = 'location_permission_granted';

interface Location {
  lat: number;
  lng: number;
}

interface LocationState {
  // User's current location (opt-in, never persisted to backend)
  userLocation: Location | null;
  isRequestingLocation: boolean;
  locationError: string | null;
  // Only true if user has granted permission (persisted)
  locationPermissionGranted: boolean;
  // Temporary flag to hide prompt for current session after denial
  promptDismissedThisSession: boolean;
  
  // Actions
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
  dismissPromptForSession: () => void;
  initFromStorage: () => void;
}

// Check if permission was previously granted
const getStoredPermission = (): boolean => {
  try {
    return localStorage.getItem(LOCATION_GRANTED_KEY) === 'true';
  } catch {
    return false;
  }
};

export const useLocation = create<LocationState>((set, get) => ({
  userLocation: null,
  isRequestingLocation: false,
  locationError: null,
  locationPermissionGranted: getStoredPermission(),
  promptDismissedThisSession: false,
  
  initFromStorage: () => {
    const granted = getStoredPermission();
    set({ locationPermissionGranted: granted });
    
    // If previously granted, try to get location automatically
    if (granted) {
      get().requestLocation();
    }
  },
  
  requestLocation: async () => {
    if (!navigator.geolocation) {
      set({ locationError: 'Standortdienste nicht verfügbar.' });
      return;
    }
    
    set({ isRequestingLocation: true, locationError: null });
    
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success - persist permission
          try {
            localStorage.setItem(LOCATION_GRANTED_KEY, 'true');
          } catch {}
          
          set({
            userLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            isRequestingLocation: false,
            locationPermissionGranted: true,
            promptDismissedThisSession: true,
          });
          resolve();
        },
        (err) => {
          console.error('Location error:', err);
          // Don't persist on error - will ask again next session
          set({
            locationError: err.code === 1 
              ? 'Standortzugriff wurde verweigert.' 
              : 'Standort konnte nicht ermittelt werden.',
            isRequestingLocation: false,
            promptDismissedThisSession: true,
          });
          resolve();
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    });
  },
  
  clearLocation: () => {
    set({ userLocation: null, locationError: null });
  },
  
  dismissPromptForSession: () => {
    // Only dismiss for this session, will ask again next time
    set({ promptDismissedThisSession: true });
  },
}));

// Helper: Calculate distance (Haversine formula)
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
