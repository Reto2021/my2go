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
      
      {/* Weather elements - rendered above gradient */}
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

// Optimized cloud component with CSS animations for performance
const Cloud = memo(function Cloud({ 
  className, 
  size = 'medium',
  opacity = 0.9,
  animationDuration = 20,
}: { 
  className?: string; 
  size?: 'small' | 'medium' | 'large';
  opacity?: number;
  animationDuration?: number;
}) {
  const sizeStyles = {
    small: { width: 80, height: 40 },
    medium: { width: 120, height: 60 },
    large: { width: 160, height: 80 },
  };
  
  const { width, height } = sizeStyles[size];

  return (
    <motion.div
      className={`absolute ${className}`}
      style={{ width, height, opacity }}
      animate={{ x: [0, 30, 0] }}
      transition={{ 
        duration: animationDuration, 
        repeat: Infinity, 
        ease: "easeInOut",
      }}
    >
      <svg viewBox="0 0 100 50" className="w-full h-full" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>
        <ellipse cx="30" cy="35" rx="25" ry="15" fill="white" fillOpacity="0.95" />
        <ellipse cx="55" cy="28" rx="30" ry="22" fill="white" fillOpacity="1" />
        <ellipse cx="75" cy="35" rx="22" ry="14" fill="white" fillOpacity="0.95" />
        <ellipse cx="45" cy="18" rx="22" ry="16" fill="white" fillOpacity="0.9" />
      </svg>
    </motion.div>
  );
});

// Sun component - optimized
const SunnyDay = memo(function SunnyDay() {
  return (
    <>
      {/* Bright sun with glow */}
      <motion.div
        className="absolute top-6 right-6 w-24 h-24"
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
      
      {/* Small decorative clouds */}
      <Cloud className="top-16 left-4" size="small" opacity={0.7} animationDuration={25} />
      <Cloud className="top-28 right-1/3" size="small" opacity={0.6} animationDuration={30} />
    </>
  );
});

// Stars and moon for night - memoized stars array
const StarryNight = memo(function StarryNight() {
  const stars = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 50,
      size: Math.random() * 2 + 1,
      delay: (i % 5) * 0.4,
      duration: 2 + (i % 3),
    })), []
  );

  return (
    <>
      {/* Stars with twinkle */}
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
      
      {/* Moon with crescent effect */}
      <motion.div
        className="absolute top-8 right-10"
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
        initial={{ top: '15%', left: '15%', opacity: 0 }}
        animate={{ 
          top: ['15%', '35%'],
          left: ['15%', '55%'],
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 10 }}
      />
    </>
  );
});

// Partly cloudy variations
const PartlyCloudyDay = memo(function PartlyCloudyDay() {
  return (
    <>
      {/* Sun peeking through */}
      <motion.div
        className="absolute top-4 right-20 w-16 h-16"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400 shadow-[0_0_50px_18px_rgba(253,224,71,0.35)]" />
      </motion.div>
      
      {/* Fluffy clouds */}
      <Cloud className="top-2 right-2" size="large" opacity={0.95} animationDuration={22} />
      <Cloud className="top-14 left-2" size="large" opacity={0.9} animationDuration={26} />
      <Cloud className="top-6 left-1/3" size="medium" opacity={0.85} animationDuration={24} />
    </>
  );
});

const PartlyCloudyNight = memo(function PartlyCloudyNight() {
  const stars = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 35,
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
      
      {/* Moon */}
      <motion.div
        className="absolute top-6 right-24 w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 shadow-[0_0_35px_10px_rgba(255,255,255,0.12)]"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      
      {/* Night clouds */}
      <Cloud className="top-2 right-0" size="large" opacity={0.75} animationDuration={24} />
      <Cloud className="top-12 left-4" size="large" opacity={0.65} animationDuration={28} />
    </>
  );
});

// Full cloudy sky
const Cloudy = memo(function Cloudy() {
  return (
    <>
      <Cloud className="top-0 -left-6" size="large" opacity={0.95} animationDuration={22} />
      <Cloud className="top-6 right-0" size="large" opacity={0.9} animationDuration={26} />
      <Cloud className="top-14 left-1/4" size="large" opacity={0.85} animationDuration={24} />
      <Cloud className="top-2 right-1/3" size="medium" opacity={0.9} animationDuration={28} />
      <Cloud className="top-20 right-1/4" size="medium" opacity={0.8} animationDuration={30} />
    </>
  );
});

// Fog layers
const Foggy = memo(function Foggy() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute h-12 bg-white/35 rounded-full blur-2xl"
          style={{
            top: `${12 + i * 16}%`,
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

// Rain with optimized drops
const Rainy = memo(function Rainy() {
  const drops = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      x: (i * 4) + Math.random() * 3,
      delay: (i % 8) * 0.15,
      duration: 0.6 + (i % 3) * 0.15,
    })), []
  );

  return (
    <>
      {/* Dark rain clouds */}
      <Cloud className="top-0 left-0" size="large" opacity={0.85} animationDuration={30} />
      <Cloud className="top-2 right-0" size="large" opacity={0.8} animationDuration={35} />
      <Cloud className="top-0 left-1/3" size="large" opacity={0.75} animationDuration={32} />
      
      {/* Rain drops - CSS animated for performance */}
      {drops.map((drop, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-6 bg-gradient-to-b from-blue-300/70 to-blue-400/40 rounded-full"
          style={{ left: `${drop.x}%`, top: '-5%' }}
          animate={{ 
            y: ['0%', '500%'], 
            opacity: [0.7, 0.3] 
          }}
          transition={{
            duration: drop.duration,
            repeat: Infinity,
            delay: drop.delay,
            ease: "linear",
          }}
        />
      ))}
    </>
  );
});

// Snow with visible, animated flakes
const Snowy = memo(function Snowy() {
  const flakes = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      x: (i * 2.9) % 100,
      size: 4 + (i % 4) * 2,
      delay: (i % 10) * 0.5,
      duration: 5 + (i % 5) * 2,
      sway: ((i % 2) === 0 ? 1 : -1) * (15 + (i % 3) * 10),
    })), []
  );

  return (
    <>
      {/* Snow clouds */}
      <Cloud className="top-0 -left-4" size="large" opacity={0.9} animationDuration={35} />
      <Cloud className="top-0 right-0" size="large" opacity={0.85} animationDuration={40} />
      
      {/* Snowflakes - larger and more visible */}
      {flakes.map((flake, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ 
            left: `${flake.x}%`, 
            top: '-3%', 
            width: flake.size, 
            height: flake.size,
            boxShadow: `0 0 ${flake.size}px ${flake.size / 2}px rgba(255,255,255,0.6)`,
          }}
          animate={{
            y: ['0%', '400%'],
            x: [0, flake.sway, 0, -flake.sway, 0],
            rotate: [0, 180, 360],
            opacity: [0.9, 0.7, 0.5],
          }}
          transition={{
            duration: flake.duration,
            repeat: Infinity,
            delay: flake.delay,
            ease: "linear",
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
