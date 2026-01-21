import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface Partner {
  id: string;
  name: string;
  city: string | null;
  lat: number;
  lng: number;
}

interface CityData {
  name: string;
  value: number;
}

interface SwissMapProps {
  partnerLocations: Partner[];
  topCities: CityData[];
}

// Swiss city coordinates [lat, lng]
const cityCoords: Record<string, [number, number]> = {
  'Zürich': [47.3769, 8.5417],
  'Bern': [46.9480, 7.4474],
  'Basel': [47.5596, 7.5886],
  'Genf': [46.2044, 6.1432],
  'Lausanne': [46.5197, 6.6323],
  'Winterthur': [47.5001, 8.7290],
  'St. Gallen': [47.4245, 9.3767],
  'Luzern': [47.0502, 8.3093],
  'Lugano': [46.0037, 8.9511],
  'Biel': [47.1368, 7.2467],
  'Thun': [46.7580, 7.6280],
  'Aarau': [47.3925, 8.0444],
  'Chur': [46.8508, 9.5316],
  'Zug': [47.1662, 8.5159],
  'Schaffhausen': [47.6958, 8.6333],
  'Brugg': [47.4830, 8.2088],
  'Baden': [47.4736, 8.3069],
  'Olten': [47.3521, 7.9079],
  'Solothurn': [47.2088, 7.5396],
  'Frauenfeld': [47.5535, 8.8987],
};

// Brand colors
const BRAND_COLORS = {
  primary: '#7AB8D6',
  secondary: '#023F5A',
  accent: '#FCB900',
};

export default function LeafletUserMap({ partnerLocations, topCities }: SwissMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Fetch Mapbox token from edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [8.2275, 46.8182], // Center of Switzerland
      zoom: 7,
      maxBounds: [
        [5.5, 45.5], // Southwest
        [11.0, 48.0], // Northeast
      ],
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Add markers when map is ready
  useEffect(() => {
    if (!map.current) return;

    const addMarkers = () => {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add user cluster markers
      topCities
        .filter(city => city.name !== 'Unbekannt' && cityCoords[city.name])
        .forEach((cityData) => {
          const coords = cityCoords[cityData.name];
          const size = Math.min(48, 24 + cityData.value * 3);
          
          const el = document.createElement('div');
          el.className = 'user-cluster-marker';
          el.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${BRAND_COLORS.accent};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            color: ${BRAND_COLORS.secondary};
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            cursor: pointer;
          `;
          el.textContent = cityData.value.toString();
          el.title = `${cityData.name}: ${cityData.value} Nutzer`;
          
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([coords[1], coords[0]])
            .addTo(map.current!);
          
          markersRef.current.push(marker);
        });

      // Add partner markers
      partnerLocations.forEach((partner) => {
        const el = document.createElement('div');
        el.className = 'partner-marker';
        el.style.cssText = `
          width: 24px;
          height: 24px;
          background: ${BRAND_COLORS.secondary};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
          position: relative;
        `;
        
        const inner = document.createElement('div');
        inner.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        `;
        el.appendChild(inner);
        el.title = `${partner.name}${partner.city ? ` – ${partner.city}` : ''}`;
        
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([partner.lng, partner.lat])
          .addTo(map.current!);
        
        markersRef.current.push(marker);
      });
    };

    if (map.current.loaded()) {
      addMarkers();
    } else {
      map.current.on('load', addMarkers);
    }
  }, [partnerLocations, topCities, mapboxToken]);

  if (loading) {
    return (
      <div className="w-full h-[400px] rounded-lg bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground">Karte wird geladen...</span>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="w-full h-[400px] rounded-lg bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">Karte nicht verfügbar</span>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-[400px] rounded-lg overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  );
}
