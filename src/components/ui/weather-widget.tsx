import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
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

export function DigitalClock({ className }: { className?: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary-foreground/10",
      className
    )}>
      <Clock className="h-3.5 w-3.5 text-secondary-foreground/70" />
      <span className="text-xs font-medium text-secondary-foreground tabular-nums">
        {hours}:{minutes}
      </span>
    </div>
  );
}

export function WeatherWidget({ className }: { className?: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Using Open-Meteo API (free, no API key needed)
        // Coordinates for Brugg, Switzerland (central to the Aargau region)
        const lat = 47.4814;
        const lng = 8.2063;
        
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=Europe/Zurich`
        );
        
        if (!response.ok) throw new Error('Weather fetch failed');
        
        const data = await response.json();
        
        // Map WMO weather codes to conditions
        const weatherCode = data.current.weather_code;
        const condition = getConditionFromCode(weatherCode);
        
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          condition,
          icon: condition,
        });
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        // Fallback weather data
        setWeather({
          temp: 8,
          condition: 'cloudy',
          icon: 'cloudy',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full bg-secondary-foreground/10", className)}>
        <div className="h-3.5 w-3.5 bg-secondary-foreground/20 rounded animate-pulse" />
        <div className="h-3 w-6 bg-secondary-foreground/20 rounded animate-pulse" />
      </div>
    );
  }

  if (!weather) return null;

  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary-foreground/10",
      className
    )}>
      <WeatherIcon className="h-3.5 w-3.5 text-secondary-foreground/70" />
      <span className="text-xs font-medium text-secondary-foreground tabular-nums">
        {weather.temp}°
      </span>
    </div>
  );
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
