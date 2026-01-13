import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Partner } from '@/lib/supabase-helpers';
import { useNavigate } from 'react-router-dom';
import { Store, Navigation, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';


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

      // Create custom marker element with modern pin design
      const el = document.createElement('div');
      el.className = 'partner-marker';
      el.style.cssText = 'cursor: pointer; transition: transform 0.2s ease;';
      
      // Outer container with pin shape
      const pinWrapper = document.createElement('div');
      pinWrapper.style.cssText = `
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
      `;
      
      // Main pin body
      const pinBody = document.createElement('div');
      const brandColor = partner.brand_color || '#F5B100';
      pinBody.style.cssText = `
        width: 44px;
        height: 44px;
        border-radius: 50% 50% 50% 0;
        background: ${brandColor};
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      `;
      
      // Inner content container (rotated back)
      const innerContainer = document.createElement('div');
      innerContainer.style.cssText = `
        transform: rotate(45deg);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      `;
      
      if (partner.logo_url) {
        const img = document.createElement('img');
        img.src = partner.logo_url;
        img.alt = partner.name || 'Partner';
        img.style.cssText = 'width: 28px; height: 28px; border-radius: 50%; object-fit: cover;';
        img.onerror = () => {
          img.remove();
          innerContainer.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`;
        };
        innerContainer.appendChild(img);
      } else {
        // Building/Store icon for partners without logo
        innerContainer.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`;
      }
      
      pinBody.appendChild(innerContainer);
      pinWrapper.appendChild(pinBody);
      
      // Small shadow/pointer at bottom
      const pointer = document.createElement('div');
      pointer.style.cssText = `
        width: 8px;
        height: 8px;
        background: ${brandColor};
        border-radius: 50%;
        margin-top: -4px;
        opacity: 0.6;
      `;
      pinWrapper.appendChild(pointer);
      
      el.appendChild(pinWrapper);
      
      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.15) translateY(-4px)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1) translateY(0)';
      });

      el.addEventListener('click', () => {
        setSelectedPartner(partner);
        map.current?.flyTo({
          center: [partner.lng!, partner.lat!],
          zoom: 14,
          duration: 500,
        });
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
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
    <div className="relative w-full h-full" style={{ minHeight: '400px' }}>
      <div 
        ref={mapContainer} 
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{ width: '100%', height: '100%' }}
      />
      
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
                  <OptimizedImage 
                    src={selectedPartner.logo_url} 
                    alt={selectedPartner.name} 
                    width={56}
                    height={56}
                    className="h-full w-full rounded-xl"
                  />
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
