import { create } from 'zustand';

interface Location {
  lat: number;
  lng: number;
}

interface LocationState {
  // User's current location (opt-in, never persisted to backend)
  userLocation: Location | null;
  isRequestingLocation: boolean;
  locationError: string | null;
  locationPermissionAsked: boolean;
  
  // Actions
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
  setLocationPermissionAsked: () => void;
}

export const useLocation = create<LocationState>((set, get) => ({
  userLocation: null,
  isRequestingLocation: false,
  locationError: null,
  locationPermissionAsked: false,
  
  requestLocation: async () => {
    if (!navigator.geolocation) {
      set({ locationError: 'Standortdienste nicht verfügbar.' });
      return;
    }
    
    set({ isRequestingLocation: true, locationError: null });
    
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          set({
            userLocation: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            isRequestingLocation: false,
            locationPermissionAsked: true,
          });
          resolve();
        },
        (err) => {
          console.error('Location error:', err);
          set({
            locationError: err.code === 1 
              ? 'Standortzugriff wurde verweigert.' 
              : 'Standort konnte nicht ermittelt werden.',
            isRequestingLocation: false,
            locationPermissionAsked: true,
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
  
  setLocationPermissionAsked: () => {
    set({ locationPermissionAsked: true });
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
