import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

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

interface LeafletUserMapProps {
  partnerLocations: Partner[];
  topCities: CityData[];
}

// Swiss city coordinates
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

// Create custom div icon for user clusters
const createClusterIcon = (count: number) => {
  const size = Math.min(60, 24 + count * 3);
  return new DivIcon({
    className: 'user-cluster-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: rgba(234, 179, 8, 0.8);
      border: 2px solid rgb(234, 179, 8);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Custom partner icon
const partnerIcon = new DivIcon({
  className: 'partner-marker',
  html: `<div style="
    width: 24px;
    height: 24px;
    background: #0C4A56;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export function LeafletUserMap({ partnerLocations, topCities }: LeafletUserMapProps) {
  // Switzerland center
  const center: [number, number] = [46.8182, 8.2275];

  return (
    <MapContainer
      center={center}
      zoom={8}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Partner markers */}
      {partnerLocations.map((partner) => (
        <Marker
          key={partner.id}
          position={[partner.lat, partner.lng]}
          icon={partnerIcon}
        >
          <Popup>
            <div className="font-sans">
              <strong>{partner.name}</strong>
              {partner.city && <><br />{partner.city}</>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* User cluster markers based on city */}
      {topCities
        .filter(city => city.name !== 'Unbekannt' && cityCoords[city.name])
        .map((cityData) => {
          const coords = cityCoords[cityData.name];
          return (
            <Marker
              key={cityData.name}
              position={coords}
              icon={createClusterIcon(cityData.value)}
            >
              <Popup>
                <div className="font-sans">
                  <strong>{cityData.name}</strong>
                  <br />{cityData.value} Nutzer
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
