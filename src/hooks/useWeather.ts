/**
 * useWeather – Wetter-Integration via Open-Meteo API (kostenlos, kein API-Key)
 * Nutzt Browser-Geolocation oder fällt auf Brugg AG zurück.
 * Aktualisiert alle 15 Minuten.
 */
import { useEffect, useState, useCallback } from "react";

export type WeatherCondition =
  | "clear"
  | "partly_cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy_rain"
  | "snow"
  | "thunderstorm";

export interface WeatherData {
  condition: WeatherCondition;
  label: string;
  temperature: number | null;
  windSpeed: number | null;
  isDay: boolean;
}

const WEATHER_LABELS: Record<WeatherCondition, string> = {
  clear: "Sonnig",
  partly_cloudy: "Teilweise bewölkt",
  cloudy: "Bewölkt",
  fog: "Nebel",
  drizzle: "Nieselregen",
  rain: "Regen",
  heavy_rain: "Starkregen",
  snow: "Schnee",
  thunderstorm: "Gewitter",
};

// WMO Weather interpretation codes → our conditions
function wmoToCondition(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly_cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code === 51 || code === 53 || code === 56) return "drizzle";
  if (code === 55 || code === 57 || code === 61 || code === 63 || code === 66) return "rain";
  if (code === 65 || code === 67 || code === 82) return "heavy_rain";
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) return "snow";
  if (code === 80 || code === 81) return "rain";
  if (code === 95 || code === 96 || code === 99) return "thunderstorm";
  return "clear";
}

// Default: Brugg AG, Schweiz
const DEFAULT_LAT = 47.4863;
const DEFAULT_LNG = 8.2083;

async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,is_day&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const data = await res.json();
  const current = data.current;
  const condition = wmoToCondition(current.weather_code);
  return {
    condition,
    label: WEATHER_LABELS[condition],
    temperature: Math.round(current.temperature_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    isDay: current.is_day === 1,
  };
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData>({
    condition: "clear",
    label: "Sonnig",
    temperature: null,
    windSpeed: null,
    isDay: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("Brugg AG");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let lat = DEFAULT_LAT;
      let lng = DEFAULT_LNG;
      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 300_000,
            });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          setLocationName("Dein Standort");
        } catch {
          setLocationName("Brugg AG");
        }
      }
      const data = await fetchWeather(lat, lng);
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wetter konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { weather, loading, error, locationName, refresh: fetchData };
}

export const ALL_CONDITIONS: WeatherCondition[] = [
  "clear", "partly_cloudy", "cloudy", "fog",
  "drizzle", "rain", "heavy_rain", "snow", "thunderstorm",
];

export { WEATHER_LABELS };
