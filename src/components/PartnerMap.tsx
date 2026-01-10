import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Partner } from '@/lib/supabase-helpers';
import { useNavigate } from 'react-router-dom';
import { Store, Navigation, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PartnerMapProps {
  partners: Partner[];
  userLocation?: { lat: number; lng: number } | null;
  mapboxToken: string;
}

export function PartnerMap({ partners, userLocation, mapboxToken }: PartnerMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const navigate = useNavigate();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    // Default center: Germany
    const defaultCenter: [number, number] = [10.4515, 51.1657];
    const defaultZoom = 5.5;

    // Calculate bounds from partners with coordinates
    const partnersWithCoords = partners.filter(p => p.lat && p.lng);
    
    let initialCenter = defaultCenter;
    let initialZoom = defaultZoom;

    if (userLocation) {
      initialCenter = [userLocation.lng, userLocation.lat];
      initialZoom = 12;
    } else if (partnersWithCoords.length > 0) {
      // Calculate center of all partners
      const avgLat = partnersWithCoords.reduce((sum, p) => sum + p.lat!, 0) / partnersWithCoords.length;
      const avgLng = partnersWithCoords.reduce((sum, p) => sum + p.lng!, 0) / partnersWithCoords.length;
      initialCenter = [avgLng, avgLat];
      initialZoom = partnersWithCoords.length === 1 ? 14 : 10;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: initialCenter,
      zoom: initialZoom,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: false }),
      'top-right'
    );

    // Fit bounds if multiple partners
    if (partnersWithCoords.length > 1 && !userLocation) {
      const bounds = new mapboxgl.LngLatBounds();
      partnersWithCoords.forEach(p => {
        bounds.extend([p.lng!, p.lat!]);
      });
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update markers when partners change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add partner markers
    partners.forEach(partner => {
      if (!partner.lat || !partner.lng) return;

      // Create custom marker element using safe DOM methods (XSS prevention)
      const el = document.createElement('div');
      el.className = 'partner-marker';
      
      const markerContainer = document.createElement('div');
      markerContainer.className = 'w-10 h-10 rounded-full shadow-lg flex items-center justify-center cursor-pointer transform transition-transform hover:scale-110';
      markerContainer.style.backgroundColor = 'hsl(var(--primary))';
      
      if (partner.logo_url) {
        const img = document.createElement('img');
        img.src = partner.logo_url;
        img.alt = partner.name || 'Partner';
        img.className = 'w-8 h-8 rounded-full object-cover';
        img.onerror = () => {
          // Fallback to icon if image fails to load
          img.remove();
          const fallbackSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          fallbackSvg.setAttribute('class', 'w-5 h-5 text-white');
          fallbackSvg.setAttribute('viewBox', '0 0 24 24');
          fallbackSvg.setAttribute('fill', 'none');
          fallbackSvg.setAttribute('stroke', 'currentColor');
          fallbackSvg.setAttribute('stroke-width', '2');
          fallbackSvg.innerHTML = '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>';
          markerContainer.appendChild(fallbackSvg);
        };
        markerContainer.appendChild(img);
      } else {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'w-5 h-5 text-white');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.innerHTML = '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>';
        markerContainer.appendChild(svg);
      }
      
      el.appendChild(markerContainer);

      el.addEventListener('click', () => {
        setSelectedPartner(partner);
        map.current?.flyTo({
          center: [partner.lng!, partner.lat!],
          zoom: 14,
          duration: 500,
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([partner.lng, partner.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [partners]);

  // Update user location marker
  useEffect(() => {
    if (!map.current) return;

    // Remove existing user marker
    userMarkerRef.current?.remove();

    if (userLocation) {
      // Create user location marker using safe DOM methods (XSS prevention)
      const el = document.createElement('div');
      
      const container = document.createElement('div');
      container.className = 'relative';
      
      const dot = document.createElement('div');
      dot.className = 'w-4 h-4 rounded-full bg-accent border-2 border-white shadow-lg';
      
      const ping = document.createElement('div');
      ping.className = 'absolute inset-0 w-4 h-4 rounded-full bg-accent animate-ping opacity-75';
      
      container.appendChild(dot);
      container.appendChild(ping);
      el.appendChild(container);

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);

      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 13,
        duration: 1000,
      });
    }
  }, [userLocation]);

  const handlePartnerClick = () => {
    if (selectedPartner) {
      navigate(`/partner/${selectedPartner.slug}`);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-2xl overflow-hidden" />
      
      {/* Selected Partner Card */}
      {selectedPartner && (
        <div className="absolute bottom-4 left-4 right-4 animate-in slide-in-from-bottom-4 duration-300">
          <div 
            className="bg-card rounded-2xl shadow-xl p-4 cursor-pointer hover:shadow-2xl transition-shadow"
            onClick={handlePartnerClick}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPartner(null);
              }}
              className="absolute top-2 right-2 p-1 rounded-full bg-muted hover:bg-muted/80"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-primary/20 flex-shrink-0 flex items-center justify-center">
                {selectedPartner.logo_url ? (
                  <img src={selectedPartner.logo_url} alt={selectedPartner.name} className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-6 w-6 text-secondary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground line-clamp-1">
                  {selectedPartner.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {selectedPartner.category || 'Partner'}
                </p>
                {selectedPartner.city && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Navigation className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{selectedPartner.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* No partners with coordinates message */}
      {partners.filter(p => p.lat && p.lng).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-2xl">
          <div className="text-center p-4">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Keine Partner mit Standortdaten gefunden</p>
          </div>
        </div>
      )}
    </div>
  );
}
