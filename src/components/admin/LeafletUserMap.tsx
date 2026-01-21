import { useEffect, useRef } from 'react';

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

// Convert lat/lng to SVG coordinates (Switzerland bounds)
const BOUNDS = {
  minLat: 45.8,
  maxLat: 47.9,
  minLng: 5.9,
  maxLng: 10.5,
};

function toSvgCoords(lat: number, lng: number, width: number, height: number): { x: number; y: number } {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * width;
  const y = height - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * height;
  return { x, y };
}

export default function LeafletUserMap({ partnerLocations, topCities }: LeafletUserMapProps) {
  const width = 800;
  const height = 400;

  return (
    <div className="w-full h-full bg-gradient-to-b from-sky-50 to-sky-100 dark:from-slate-800 dark:to-slate-900 rounded-lg overflow-hidden relative">
      {/* Switzerland outline (simplified) */}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Background */}
        <rect width={width} height={height} fill="transparent" />
        
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={(height / 4) * i}
            x2={width}
            y2={(height / 4) * i}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <line
            key={`v-${i}`}
            x1={(width / 8) * i}
            y1={0}
            x2={(width / 8) * i}
            y2={height}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        ))}

        {/* User cluster markers */}
        {topCities
          .filter(city => city.name !== 'Unbekannt' && cityCoords[city.name])
          .map((cityData) => {
            const coords = cityCoords[cityData.name];
            const { x, y } = toSvgCoords(coords[0], coords[1], width, height);
            const size = Math.min(40, 16 + cityData.value * 2);
            
            return (
              <g key={cityData.name}>
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill="rgba(234, 179, 8, 0.7)"
                  stroke="rgb(234, 179, 8)"
                  strokeWidth={2}
                  className="drop-shadow-md"
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={12}
                  fontWeight="bold"
                >
                  {cityData.value}
                </text>
                <title>{cityData.name}: {cityData.value} Nutzer</title>
              </g>
            );
          })}

        {/* Partner markers */}
        {partnerLocations.map((partner) => {
          const { x, y } = toSvgCoords(partner.lat, partner.lng, width, height);
          
          return (
            <g key={partner.id}>
              <circle
                cx={x}
                cy={y}
                r={10}
                fill="hsl(197, 96%, 18%)"
                stroke="white"
                strokeWidth={2}
                className="drop-shadow-md cursor-pointer hover:r-12 transition-all"
              />
              <title>{partner.name}{partner.city ? ` - ${partner.city}` : ''}</title>
            </g>
          );
        })}
      </svg>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
        Schweiz
      </div>
    </div>
  );
}
