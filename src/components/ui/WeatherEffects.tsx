/**
 * WeatherEffects – Visuelle Wetter-Overlays für den Hero-Bereich
 * Regen, Nebel, Schnee, Sonnenstrahlen, Gewitter-Blitze
 * GPU-beschleunigt, respektiert prefers-reduced-motion
 */
import { useMemo } from "react";
import type { WeatherCondition } from "@/hooks/useWeather";

interface WeatherEffectsProps {
  condition: WeatherCondition;
  intensity?: "light" | "normal" | "heavy";
}

// ── Regentropfen ──
function RainEffect({ intensity = "normal" }: { intensity?: string }) {
  const count = intensity === "heavy" ? 80 : intensity === "light" ? 20 : 40;
  const drops = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2}s`,
        duration: `${0.4 + Math.random() * 0.4}s`,
        opacity: 0.3 + Math.random() * 0.4,
        width: intensity === "heavy" ? 2 : 1.5,
        height: intensity === "heavy" ? 20 + Math.random() * 15 : 12 + Math.random() * 10,
      })),
    [count, intensity]
  );

  return (
    <div className="weather-rain" aria-hidden="true">
      {drops.map((d) => (
        <div
          key={d.id}
          className="weather-raindrop"
          style={{
            left: d.left,
            animationDelay: d.delay,
            animationDuration: d.duration,
            opacity: d.opacity,
            width: `${d.width}px`,
            height: `${d.height}px`,
          }}
        />
      ))}
    </div>
  );
}

// ── Schneeflocken ──
function SnowEffect() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 8}s`,
        duration: `${4 + Math.random() * 6}s`,
        size: 2 + Math.random() * 4,
        opacity: 0.4 + Math.random() * 0.5,
        drift: -20 + Math.random() * 40,
      })),
    []
  );

  return (
    <div className="weather-snow" aria-hidden="true">
      {flakes.map((f) => (
        <div
          key={f.id}
          className="weather-snowflake"
          style={{
            left: f.left,
            animationDelay: f.delay,
            animationDuration: f.duration,
            opacity: f.opacity,
            width: `${f.size}px`,
            height: `${f.size}px`,
            "--snow-drift": `${f.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ── Nebel ──
function FogEffect() {
  return (
    <div className="weather-fog" aria-hidden="true">
      <div className="weather-fog-layer weather-fog-1" />
      <div className="weather-fog-layer weather-fog-2" />
      <div className="weather-fog-layer weather-fog-3" />
    </div>
  );
}

// ── Sonnenstrahlen ──
function SunraysEffect() {
  return (
    <div className="weather-sunrays" aria-hidden="true">
      <div className="weather-sunray weather-sunray-1" />
      <div className="weather-sunray weather-sunray-2" />
      <div className="weather-sunray weather-sunray-3" />
    </div>
  );
}

// ── Gewitter-Blitze ──
function ThunderstormEffect() {
  return (
    <div className="weather-thunder" aria-hidden="true">
      <div className="weather-lightning" />
      <RainEffect intensity="heavy" />
    </div>
  );
}

// ── Wolken-Overlay ──
function CloudOverlay({ opacity = 0.15 }: { opacity?: number }) {
  return (
    <div
      className="weather-cloud-overlay"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}

export function WeatherEffects({ condition, intensity = "normal" }: WeatherEffectsProps) {
  switch (condition) {
    case "clear":
      return <SunraysEffect />;
    case "partly_cloudy":
      return <CloudOverlay opacity={0.1} />;
    case "cloudy":
      return <CloudOverlay opacity={0.25} />;
    case "fog":
      return <FogEffect />;
    case "drizzle":
      return <RainEffect intensity="light" />;
    case "rain":
      return <RainEffect intensity={intensity} />;
    case "heavy_rain":
      return <RainEffect intensity="heavy" />;
    case "snow":
      return <SnowEffect />;
    case "thunderstorm":
      return <ThunderstormEffect />;
    default:
      return null;
  }
}
