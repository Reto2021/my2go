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

// Switzerland bounds for coordinate conversion
const BOUNDS = {
  minLat: 45.8,
  maxLat: 47.9,
  minLng: 5.9,
  maxLng: 10.6,
};

const SVG_WIDTH = 600;
const SVG_HEIGHT = 380;

function toSvgCoords(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * SVG_WIDTH;
  const y = SVG_HEIGHT - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * SVG_HEIGHT;
  return { x, y };
}

// Simplified Switzerland outline path (SVG coordinates)
const SWITZERLAND_PATH = `
  M 85,180 
  L 75,160 L 60,155 L 45,165 L 30,175 L 25,195 L 35,215 
  L 55,230 L 70,250 L 90,265 L 110,275 L 130,285 L 150,290 
  L 175,285 L 195,275 L 220,280 L 245,290 L 270,295 L 295,290 
  L 320,280 L 345,270 L 370,275 L 395,280 L 420,275 L 445,265 
  L 470,255 L 495,260 L 520,270 L 545,265 L 560,250 L 570,230 
  L 575,210 L 565,190 L 550,175 L 530,165 L 510,155 L 485,150 
  L 460,145 L 435,135 L 410,125 L 385,115 L 360,110 L 335,105 
  L 310,100 L 285,95 L 260,90 L 235,85 L 210,82 L 185,85 
  L 160,90 L 135,100 L 115,115 L 100,135 L 90,155 L 85,180 
  Z
`;

// Brand colors
const BRAND_COLORS = {
  primary: '#7AB8D6',       // Sky Blue
  secondary: '#023F5A',     // Deep Teal  
  accent: '#FCB900',        // Bright Yellow/Gold
  success: '#22C55E',       // Green
};

export default function LeafletUserMap({ partnerLocations, topCities }: SwissMapProps) {
  return (
    <div className="w-full h-full relative">
      <svg 
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
        className="w-full h-full"
        style={{ minHeight: '350px' }}
      >
        {/* Background */}
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="hsl(200, 25%, 97%)" rx={8} />
        
        {/* Switzerland outline */}
        <path
          d={SWITZERLAND_PATH}
          fill="hsl(200, 30%, 92%)"
          stroke="hsl(200, 30%, 80%)"
          strokeWidth={2}
          className="drop-shadow-sm"
        />
        
        {/* Subtle inner shadow for depth */}
        <path
          d={SWITZERLAND_PATH}
          fill="none"
          stroke="hsl(200, 20%, 85%)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* User cluster markers (behind partners) */}
        {topCities
          .filter(city => city.name !== 'Unbekannt' && cityCoords[city.name])
          .map((cityData) => {
            const coords = cityCoords[cityData.name];
            const { x, y } = toSvgCoords(coords[0], coords[1]);
            const size = Math.min(32, 14 + cityData.value * 2.5);
            
            return (
              <g key={cityData.name} className="cursor-pointer">
                {/* Outer glow */}
                <circle
                  cx={x}
                  cy={y}
                  r={size + 4}
                  fill={BRAND_COLORS.accent}
                  fillOpacity={0.2}
                />
                {/* Main circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={size}
                  fill={BRAND_COLORS.accent}
                  fillOpacity={0.85}
                  stroke="white"
                  strokeWidth={2}
                />
                {/* Count text */}
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={BRAND_COLORS.secondary}
                  fontSize={11}
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                >
                  {cityData.value}
                </text>
                <title>{cityData.name}: {cityData.value} Nutzer</title>
              </g>
            );
          })}

        {/* Partner markers (on top) */}
        {partnerLocations.map((partner) => {
          const { x, y } = toSvgCoords(partner.lat, partner.lng);
          
          return (
            <g key={partner.id} className="cursor-pointer">
              {/* Outer glow */}
              <circle
                cx={x}
                cy={y}
                r={14}
                fill={BRAND_COLORS.secondary}
                fillOpacity={0.15}
              />
              {/* Main circle */}
              <circle
                cx={x}
                cy={y}
                r={10}
                fill={BRAND_COLORS.secondary}
                stroke="white"
                strokeWidth={2.5}
              />
              {/* Inner dot */}
              <circle
                cx={x}
                cy={y}
                r={3}
                fill="white"
              />
              <title>{partner.name}{partner.city ? ` – ${partner.city}` : ''}</title>
            </g>
          );
        })}

        {/* Map attribution */}
        <text
          x={15}
          y={SVG_HEIGHT - 12}
          fill="hsl(200, 20%, 60%)"
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          Schweiz
        </text>
      </svg>
    </div>
  );
}
