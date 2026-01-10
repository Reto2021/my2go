import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import type { WeatherType } from '@/hooks/useWeather';

interface WeatherBackgroundProps {
  weatherType: WeatherType;
  className?: string;
}

// Positive weather messages
const weatherMessages: Record<WeatherType, string> = {
  'clear-day': 'Perfektes Wetter zum Taler sammeln! ☀️',
  'clear-night': 'Eine wunderbare Nacht! 🌙',
  'partly-cloudy-day': 'Angenehm mild heute! ⛅',
  'partly-cloudy-night': 'Gemütlicher Abend! 🌤️',
  'cloudy': 'Ideal für einen Stadtbummel! ☁️',
  'fog': 'Mystische Stimmung! 🌫️',
  'rain': 'Perfekt für Kaffee beim Partner! ☔',
  'snow': 'Winterzauber! ❄️',
  'thunderstorm': 'Gemütlich drinnen bleiben! ⛈️',
};

export function getWeatherMessage(weatherType: WeatherType): string {
  return weatherMessages[weatherType] || 'Schöner Tag!';
}

// Memoized base gradients for performance
const gradients: Record<WeatherType, string> = {
  'clear-day': 'linear-gradient(180deg, #4A90D9 0%, #87CEEB 50%, #B0E0E6 100%)',
  'clear-night': 'linear-gradient(180deg, #0a1628 0%, #1a2744 50%, #2d3a4f 100%)',
  'partly-cloudy-day': 'linear-gradient(180deg, #6BA3D6 0%, #9AC4E8 50%, #C5DCF0 100%)',
  'partly-cloudy-night': 'linear-gradient(180deg, #1a2744 0%, #2d4a6a 50%, #3d5a7a 100%)',
  'cloudy': 'linear-gradient(180deg, #6B7B8C 0%, #8E9EAE 50%, #B5C5D5 100%)',
  'fog': 'linear-gradient(180deg, #9CA8B3 0%, #B5C0C9 50%, #D0D8DF 100%)',
  'rain': 'linear-gradient(180deg, #4A5568 0%, #6B7C8E 50%, #8E9EAE 100%)',
  'snow': 'linear-gradient(180deg, #8BA4BE 0%, #A8BDD3 50%, #C5D5E5 100%)',
  'thunderstorm': 'linear-gradient(180deg, #2D3748 0%, #4A5568 50%, #6B7C8E 100%)',
};

export const WeatherBackground = memo(function WeatherBackground({ weatherType, className }: WeatherBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Base gradient */}
      <div 
        className="absolute inset-0 transition-all duration-1000" 
        style={{ background: gradients[weatherType] }} 
      />
      
      {/* Weather elements - rendered above gradient but below content */}
      <div className="absolute inset-0 z-[1]">
        {weatherType === 'clear-day' && <SunnyDay />}
        {weatherType === 'clear-night' && <StarryNight />}
        {weatherType === 'partly-cloudy-day' && <PartlyCloudyDay />}
        {weatherType === 'partly-cloudy-night' && <PartlyCloudyNight />}
        {weatherType === 'cloudy' && <Cloudy />}
        {weatherType === 'fog' && <Foggy />}
        {weatherType === 'rain' && <Rainy />}
        {weatherType === 'snow' && <Snowy />}
        {weatherType === 'thunderstorm' && <Thunderstorm />}
      </div>
    </div>
  );
});

// Dynamic floating cloud component with smooth animations
const Cloud = memo(function Cloud({ 
  className, 
  size = 'medium',
  opacity = 0.9,
  animationDuration = 20,
  yOffset = 8,
}: { 
  className?: string; 
  size?: 'small' | 'medium' | 'large';
  opacity?: number;
  animationDuration?: number;
  yOffset?: number;
}) {
  const sizeStyles = {
    small: { width: 100, height: 50 },
    medium: { width: 150, height: 75 },
    large: { width: 200, height: 100 },
  };
  
  const { width, height } = sizeStyles[size];

  return (
    <motion.div
      className={`absolute ${className}`}
      style={{ width, height, opacity }}
      animate={{ 
        x: [0, 40, 0, -20, 0],
        y: [0, -yOffset, 0, yOffset / 2, 0],
        scale: [1, 1.02, 1, 0.98, 1],
      }}
      transition={{ 
        duration: animationDuration, 
        repeat: Infinity, 
        ease: "easeInOut",
      }}
    >
      <svg viewBox="0 0 100 50" className="w-full h-full" style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' }}>
        <ellipse cx="25" cy="35" rx="22" ry="14" fill="white" fillOpacity="0.9" />
        <ellipse cx="50" cy="28" rx="28" ry="20" fill="white" fillOpacity="1" />
        <ellipse cx="75" cy="33" rx="20" ry="13" fill="white" fillOpacity="0.92" />
        <ellipse cx="40" cy="18" rx="18" ry="14" fill="white" fillOpacity="0.85" />
        <ellipse cx="60" cy="16" rx="15" ry="12" fill="white" fillOpacity="0.8" />
      </svg>
    </motion.div>
  );
});

// Sun component - optimized, positioned below header
const SunnyDay = memo(function SunnyDay() {
  return (
    <>
      {/* Bright sun with glow - positioned below header */}
      <motion.div
        className="absolute top-20 right-6 w-24 h-24"
        animate={{ 
          scale: [1, 1.08, 1],
          rotate: [0, 3, -3, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Sun glow */}
        <div className="absolute inset-0 rounded-full bg-yellow-200/40 blur-xl scale-150" />
        {/* Sun core */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-300 shadow-[0_0_80px_30px_rgba(253,224,71,0.5)]" />
        {/* Sun rays - reduced for performance */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <motion.div
            key={deg}
            className="absolute top-1/2 left-1/2 w-1.5 h-10 bg-gradient-to-t from-yellow-300/80 to-transparent origin-bottom rounded-full"
            style={{ 
              transform: `translate(-50%, -100%) rotate(${deg}deg)`,
            }}
            animate={{ opacity: [0.5, 0.9, 0.5], scaleY: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </motion.div>
      
      {/* Small decorative clouds - gentle floating */}
      <Cloud className="top-28 left-4" size="small" opacity={0.75} animationDuration={18} yOffset={6} />
      <Cloud className="top-40 right-1/3" size="small" opacity={0.65} animationDuration={22} yOffset={5} />
    </>
  );
});

// Stars and moon for night - memoized stars array
const StarryNight = memo(function StarryNight() {
  const stars = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => ({
      x: Math.random() * 100,
      y: 20 + Math.random() * 50, // Start below header (20% = ~88px)
      size: Math.random() * 2 + 1,
      delay: (i % 5) * 0.4,
      duration: 2 + (i % 3),
    })), []
  );

  return (
    <>
      {/* Stars with twinkle - positioned below header */}
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            boxShadow: `0 0 ${star.size * 2}px ${star.size / 2}px rgba(255,255,255,0.5)`,
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }}
        />
      ))}
      
      {/* Moon with crescent effect - positioned below header */}
      <motion.div
        className="absolute top-24 right-10"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative w-20 h-20">
          {/* Moon glow */}
          <div className="absolute inset-0 rounded-full bg-blue-100/20 blur-xl scale-125" />
          {/* Moon surface */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 shadow-[0_0_50px_15px_rgba(255,255,255,0.15)]" />
          {/* Craters */}
          <div className="absolute top-3 left-5 w-4 h-4 rounded-full bg-gray-300/40" />
          <div className="absolute top-10 left-9 w-3 h-3 rounded-full bg-gray-300/30" />
          <div className="absolute top-6 right-4 w-2.5 h-2.5 rounded-full bg-gray-300/35" />
        </div>
      </motion.div>
      
      {/* Occasional shooting star */}
      <motion.div
        className="absolute w-1 h-1 bg-white rounded-full"
        style={{ boxShadow: '0 0 10px 3px white, -30px -15px 30px 3px rgba(255,255,255,0.4)' }}
        initial={{ top: '25%', left: '15%', opacity: 0 }}
        animate={{ 
          top: ['25%', '45%'],
          left: ['15%', '55%'],
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 10 }}
      />
    </>
  );
});

// Partly cloudy variations - positioned below header
const PartlyCloudyDay = memo(function PartlyCloudyDay() {
  return (
    <>
      {/* Sun peeking through */}
      <motion.div
        className="absolute top-20 right-20 w-16 h-16"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400 shadow-[0_0_50px_18px_rgba(253,224,71,0.35)]" />
      </motion.div>
      
      {/* Fluffy clouds - gentle floating motion */}
      <Cloud className="top-20 right-2" size="large" opacity={0.95} animationDuration={18} yOffset={10} />
      <Cloud className="top-32 left-2" size="large" opacity={0.9} animationDuration={22} yOffset={8} />
      <Cloud className="top-24 left-1/3" size="medium" opacity={0.85} animationDuration={20} yOffset={6} />
    </>
  );
});

const PartlyCloudyNight = memo(function PartlyCloudyNight() {
  const stars = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * 100,
      y: 20 + Math.random() * 30, // Start below header
      size: Math.random() * 1.5 + 1,
      delay: (i % 4) * 0.5,
    })), []
  );

  return (
    <>
      {/* Stars behind clouds */}
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: star.delay }}
        />
      ))}
      
      {/* Moon - positioned below header */}
      <motion.div
        className="absolute top-24 right-24 w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 shadow-[0_0_35px_10px_rgba(255,255,255,0.12)]"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      
      {/* Night clouds - gentle floating */}
      <Cloud className="top-20 right-0" size="large" opacity={0.75} animationDuration={20} yOffset={8} />
      <Cloud className="top-32 left-4" size="large" opacity={0.65} animationDuration={24} yOffset={6} />
    </>
  );
});

// Full cloudy sky - lots of gentle floating clouds
const Cloudy = memo(function Cloudy() {
  return (
    <>
      <Cloud className="top-20 -left-6" size="large" opacity={0.95} animationDuration={16} yOffset={12} />
      <Cloud className="top-24 right-0" size="large" opacity={0.9} animationDuration={20} yOffset={10} />
      <Cloud className="top-36 left-1/4" size="large" opacity={0.85} animationDuration={18} yOffset={8} />
      <Cloud className="top-20 right-1/3" size="medium" opacity={0.9} animationDuration={22} yOffset={9} />
      <Cloud className="top-44 right-1/4" size="medium" opacity={0.8} animationDuration={24} yOffset={7} />
    </>
  );
});

// Fog layers - positioned below header
const Foggy = memo(function Foggy() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute h-12 bg-white/35 rounded-full blur-2xl"
          style={{
            top: `${22 + i * 14}%`, // Start below header
            left: '-10%',
            width: '120%',
          }}
          animate={{ x: ['-3%', '3%', '-3%'] }}
          transition={{ duration: 10 + i * 3, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
});

// Rain with gentle clouds and animated raindrops
const Rainy = memo(function Rainy() {
  const drops = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      x: (i * 3.3) + Math.random() * 2,
      delay: (i % 10) * 0.12,
      duration: 0.8 + (i % 4) * 0.2,
      width: 1 + (i % 2) * 0.5,
    })), []
  );

  return (
    <>
      {/* Dark rain clouds - gentle floating */}
      <Cloud className="top-20 left-0" size="large" opacity={0.88} animationDuration={22} yOffset={6} />
      <Cloud className="top-24 right-0" size="large" opacity={0.82} animationDuration={26} yOffset={5} />
      <Cloud className="top-20 left-1/3" size="large" opacity={0.78} animationDuration={24} yOffset={7} />
      
      {/* Rain drops - natural falling motion */}
      {drops.map((drop, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ 
            left: `${drop.x}%`, 
            top: '20%',
            width: drop.width,
            height: 20,
            background: 'linear-gradient(180deg, rgba(147,197,253,0.8) 0%, rgba(147,197,253,0.3) 100%)',
          }}
          animate={{ 
            y: ['0%', '380%'], 
            opacity: [0.8, 0.2],
            scaleY: [1, 1.2, 1],
          }}
          transition={{
            duration: drop.duration,
            repeat: Infinity,
            delay: drop.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </>
  );
});

// Snow with beautiful, gently floating flakes
const Snowy = memo(function Snowy() {
  const flakes = useMemo(() =>
    Array.from({ length: 45 }, (_, i) => ({
      x: (i * 2.2) % 100,
      size: 6 + (i % 5) * 3,
      delay: (i % 12) * 0.4,
      duration: 8 + (i % 6) * 3,
      swayAmount: 30 + (i % 4) * 15,
      swayDirection: (i % 2) === 0 ? 1 : -1,
    })), []
  );

  return (
    <>
      {/* Snow clouds - gentle floating */}
      <Cloud className="top-20 -left-4" size="large" opacity={0.92} animationDuration={30} yOffset={10} />
      <Cloud className="top-24 right-0" size="large" opacity={0.88} animationDuration={35} yOffset={8} />
      <Cloud className="top-28 left-1/3" size="medium" opacity={0.85} animationDuration={40} yOffset={6} />
      
      {/* Snowflakes - gentle falling with natural sway */}
      {flakes.map((flake, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ 
            left: `${flake.x}%`, 
            top: '18%',
            width: flake.size, 
            height: flake.size,
            background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.3) 100%)',
            boxShadow: `0 0 ${flake.size * 1.5}px ${flake.size * 0.6}px rgba(255,255,255,0.5)`,
          }}
          animate={{
            y: ['0%', '320%'],
            x: [
              0, 
              flake.swayDirection * flake.swayAmount, 
              0, 
              -flake.swayDirection * flake.swayAmount * 0.7, 
              0
            ],
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.1, 1, 0.9, 1],
          }}
          transition={{
            duration: flake.duration,
            repeat: Infinity,
            delay: flake.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
});

// Thunderstorm
const Thunderstorm = memo(function Thunderstorm() {
  return (
    <>
      {/* Lightning flash overlay - CSS keyframes for performance */}
      <div 
        className="absolute inset-0 bg-white/0 animate-lightning pointer-events-none z-10" 
      />
      
      {/* Rain layer */}
      <Rainy />
    </>
  );
});
