import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherData {
  temp: number;
  condition: string;
}

const WEATHER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'clear': Sun,
  'sunny': Sun,
  'cloudy': Cloud,
  'clouds': Cloud,
  'overcast': Cloud,
  'rain': CloudRain,
  'drizzle': CloudRain,
  'snow': CloudSnow,
  'thunder': CloudLightning,
  'storm': CloudLightning,
  'fog': CloudFog,
  'mist': CloudFog,
  'wind': Wind,
};

function getWeatherIcon(condition: string): React.ComponentType<{ className?: string }> {
  const lowerCondition = condition.toLowerCase();
  for (const [key, Icon] of Object.entries(WEATHER_ICONS)) {
    if (lowerCondition.includes(key)) {
      return Icon;
    }
  }
  return Cloud;
}

// WMO Weather interpretation codes
function getConditionFromCode(code: number): string {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'sunny';
  if (code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95 && code <= 99) return 'thunder';
  return 'cloudy';
}

export function ClockWeatherWidget({ className }: { className?: string }) {
  const [time, setTime] = useState(new Date());
  const [colonVisible, setColonVisible] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  // Clock with blinking colon
  useEffect(() => {
    const clockInterval = setInterval(() => setTime(new Date()), 1000);
    const blinkInterval = setInterval(() => setColonVisible(v => !v), 500);
    return () => {
      clearInterval(clockInterval);
      clearInterval(blinkInterval);
    };
  }, []);

  // Weather fetch
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const lat = 47.4814;
        const lng = 8.2063;
        
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=Europe/Zurich`
        );
        
        if (!response.ok) throw new Error('Weather fetch failed');
        
        const data = await response.json();
        const weatherCode = data.current.weather_code;
        const condition = getConditionFromCode(weatherCode);
        
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          condition,
        });
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        setWeather({ temp: 8, condition: 'cloudy' });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const WeatherIcon = weather ? getWeatherIcon(weather.condition) : Cloud;

  return (
    <div className={cn(
      "flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary-foreground/10",
      className
    )}>
      {/* Digital Clock with blinking colon */}
      <span className="text-sm font-semibold text-secondary-foreground tabular-nums">
        {hours}
        <span className={cn("transition-opacity", colonVisible ? "opacity-100" : "opacity-30")}>:</span>
        {minutes}
      </span>
      
      {/* Divider */}
      <div className="w-px h-3 bg-secondary-foreground/20" />
      
      {/* Weather */}
      {loading ? (
        <div className="flex items-center gap-1">
          <div className="h-3.5 w-3.5 bg-secondary-foreground/20 rounded animate-pulse" />
          <div className="h-3 w-5 bg-secondary-foreground/20 rounded animate-pulse" />
        </div>
      ) : weather && (
        <div className="flex items-center gap-1">
          <WeatherIcon className="h-4 w-4 text-secondary-foreground/80" />
          <span className="text-sm font-semibold text-secondary-foreground tabular-nums">
            {weather.temp}°
          </span>
        </div>
      )}
    </div>
  );
}
