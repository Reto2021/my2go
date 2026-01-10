import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  description: string;
  icon: WeatherType;
}

export type WeatherType = 
  | 'clear-day' 
  | 'clear-night' 
  | 'partly-cloudy-day' 
  | 'partly-cloudy-night'
  | 'cloudy' 
  | 'fog'
  | 'rain' 
  | 'snow' 
  | 'thunderstorm';

// WMO Weather interpretation codes
function getWeatherType(code: number, isDay: boolean): WeatherType {
  // Clear sky
  if (code === 0) return isDay ? 'clear-day' : 'clear-night';
  
  // Mainly clear, partly cloudy
  if (code === 1 || code === 2) return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
  
  // Overcast
  if (code === 3) return 'cloudy';
  
  // Fog
  if (code >= 45 && code <= 48) return 'fog';
  
  // Drizzle and Rain
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 80 && code <= 82) return 'rain';
  
  // Snow
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 85 && code <= 86) return 'snow';
  
  // Thunderstorm
  if (code >= 95 && code <= 99) return 'thunderstorm';
  
  return isDay ? 'clear-day' : 'clear-night';
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Klarer Himmel';
  if (code === 1) return 'Überwiegend klar';
  if (code === 2) return 'Teilweise bewölkt';
  if (code === 3) return 'Bewölkt';
  if (code >= 45 && code <= 48) return 'Nebelig';
  if (code >= 51 && code <= 55) return 'Nieselregen';
  if (code >= 56 && code <= 57) return 'Gefrierender Niesel';
  if (code >= 61 && code <= 65) return 'Regen';
  if (code >= 66 && code <= 67) return 'Gefrierender Regen';
  if (code >= 71 && code <= 75) return 'Schneefall';
  if (code === 77) return 'Schneekörner';
  if (code >= 80 && code <= 82) return 'Regenschauer';
  if (code >= 85 && code <= 86) return 'Schneeschauer';
  if (code === 95) return 'Gewitter';
  if (code >= 96 && code <= 99) return 'Gewitter mit Hagel';
  return 'Unbekannt';
}

export function useWeather(lat?: number | null, lng?: number | null) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lat || !lng) return;

    const fetchWeather = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,is_day&timezone=auto`
        );
        
        if (!response.ok) throw new Error('Wetter konnte nicht geladen werden');
        
        const data = await response.json();
        const current = data.current;
        
        const weatherCode = current.weather_code;
        const isDay = current.is_day === 1;
        
        setWeather({
          temperature: Math.round(current.temperature_2m),
          weatherCode,
          isDay,
          description: getWeatherDescription(weatherCode),
          icon: getWeatherType(weatherCode, isDay),
        });
      } catch (err) {
        setError((err as Error).message);
        // Fallback to time-based weather
        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 20;
        setWeather({
          temperature: 15,
          weatherCode: 0,
          isDay,
          description: isDay ? 'Sonnig' : 'Klare Nacht',
          icon: isDay ? 'clear-day' : 'clear-night',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
    
    // Refresh every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lat, lng]);

  // If no location, use time-based fallback
  useEffect(() => {
    if (lat || lng) return;
    
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 20;
    setWeather({
      temperature: 15,
      weatherCode: 0,
      isDay,
      description: isDay ? 'Sonnig' : 'Klare Nacht',
      icon: isDay ? 'clear-day' : 'clear-night',
    });
  }, [lat, lng]);

  return { weather, isLoading, error };
}
