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
          {Array.from({ length: 40 }).map((_, i) => {
            const size = 1.5 + Math.random() * 3;
            const isLarge = i < 8;
            return (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${isLarge ? size + 1.5 : size}px`,
                  height: `${isLarge ? size + 1.5 : size}px`,
                  top: `${3 + Math.random() * 50}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0.2 + Math.random() * 0.6,
                  background: isLarge
                    ? 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(200,220,255,0.6) 50%, transparent 100%)'
                    : 'white',
                  boxShadow: isLarge ? '0 0 6px 2px rgba(200,220,255,0.4)' : '0 0 3px 1px rgba(255,255,255,0.3)',
                  animation: `hero-twinkle ${3 + Math.random() * 7}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 10}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Shooting stars – rare, different angles */}
      {timeOfDay === "night" && (
        <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
          {[
            { top: '10%', left: '60%', anim: 'shooting-star-1', dur: '45s', delay: '8s' },
            { top: '25%', left: '20%', anim: 'shooting-star-2', dur: '62s', delay: '30s' },
            { top: '15%', left: '75%', anim: 'shooting-star-3', dur: '80s', delay: '55s' },
          ].map((s, i) => (
            <div
              key={`shoot-${i}`}
              className="absolute"
              style={{
                top: s.top,
                left: s.left,
                width: 0,
                height: '1.5px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(200,220,255,0.3), transparent)',
                borderRadius: '2px',
                boxShadow: '0 0 4px 1px rgba(200,220,255,0.3)',
                animation: `${s.anim} ${s.dur} ease-in-out ${s.delay} infinite`,
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
