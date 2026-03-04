/**
 * HeroDynamic – Dynamischer Hero-Hintergrund
 * Kombiniert: 16 Jahreszeit/Tageszeit-Bilder + Wetter-Effekte + Vögel/Wolken-Animationen
 * Wird als Replacement für die statische .hero-section CSS-Klasse verwendet.
 *
 * Usage in BrowseModeHome.tsx:
 *   <section className="relative overflow-hidden text-foreground pt-20" style={{ minHeight: '60vh' }}>
 *     <HeroDynamic />
 *     <HeroAnimations />  // Vögel & Wolken (nur bei Tag)
 *     <div className="container relative z-10 ...">
 *       ... existing content ...
 *     </div>
 *   </section>
 */
import { useEffect, useRef, useState } from "react";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { useWeather } from "@/hooks/useWeather";
import { WeatherEffects } from "./WeatherEffects";

export function HeroDynamic() {
  const { imageDesktop, timeOfDay, season, textColor } = useTimeOfDay();
  const { weather } = useWeather();
  const [loaded, setLoaded] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const prevImageRef = useRef<string>("");

  // Preload current image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = imageDesktop;
  }, []);

  // Crossfade on image change
  useEffect(() => {
    if (prevImageRef.current && prevImageRef.current !== imageDesktop) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setTransitioning(false);
        prevImageRef.current = imageDesktop;
      }, 1200);
      return () => clearTimeout(timer);
    }
    prevImageRef.current = imageDesktop;
  }, [imageDesktop]);

  const showBirds = timeOfDay !== "night";

  return (
    <>
      {/* Previous image for crossfade */}
      {transitioning && prevImageRef.current && (
        <div
          className="absolute inset-0 z-[0]"
          style={{
            backgroundImage: `url(${prevImageRef.current})`,
            backgroundSize: "cover",
            backgroundPosition: "center bottom",
            backgroundRepeat: "no-repeat",
            animation: "hero-fadeOut 1.2s ease-in-out forwards",
          }}
        />
      )}

      {/* Active background */}
      <div
        className="absolute inset-0 z-[0]"
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 1.2s ease-in-out",
          backgroundImage: `url(${imageDesktop})`,
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Sonnenglow for sunrise/goldenhour */}
      {(timeOfDay === "sunrise" || timeOfDay === "goldenhour") && (
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background:
              timeOfDay === "sunrise"
                ? "radial-gradient(ellipse 60% 40% at 50% 75%, rgba(255,176,136,0.12) 0%, transparent 70%)"
                : "radial-gradient(ellipse 60% 40% at 50% 75%, rgba(240,181,16,0.1) 0%, transparent 70%)",
            animation: "sun-pulse 6s ease-in-out infinite",
          }}
        />
      )}

      {/* Weather effects overlay */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        <WeatherEffects condition={weather.condition} />
      </div>

      {/* Stars for night */}
      {timeOfDay === "night" && (
        <div className="absolute inset-0 z-[1] pointer-events-none">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${1 + Math.random() * 2}px`,
                height: `${1 + Math.random() * 2}px`,
                top: `${5 + Math.random() * 45}%`,
                left: `${Math.random() * 100}%`,
                opacity: 0.3 + Math.random() * 0.5,
                animation: `hero-twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background:
            textColor === "dark"
              ? "radial-gradient(ellipse at center, transparent 60%, rgba(255,255,255,0.15) 100%)"
              : "radial-gradient(ellipse at center, transparent 50%, rgba(10,26,24,0.3) 100%)",
        }}
      />

      {/* Weather info badge (bottom-right, subtle) */}
      {weather.temperature !== null && (
        <div
          className="absolute bottom-3 right-3 z-[10] px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide"
          style={{
            background: textColor === "dark" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            color: textColor === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)",
          }}
        >
          {weather.temperature}° · {weather.label}
        </div>
      )}
    </>
  );
}
