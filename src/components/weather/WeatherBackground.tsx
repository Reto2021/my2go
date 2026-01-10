import { useEffect, useState } from 'react';
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

export function WeatherBackground({ weatherType, className }: WeatherBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Base gradient */}
      <div className="absolute inset-0 transition-colors duration-1000" style={getBaseGradient(weatherType)} />
      
      {/* Weather elements */}
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
  );
}

export function getWeatherMessage(weatherType: WeatherType): string {
  return weatherMessages[weatherType] || 'Schöner Tag!';
}

function getBaseGradient(type: WeatherType): React.CSSProperties {
  const gradients: Record<WeatherType, string> = {
    'clear-day': 'linear-gradient(180deg, #4A90D9 0%, #87CEEB 50%, #B0E0E6 100%)',
    'clear-night': 'linear-gradient(180deg, #0a1628 0%, #1a2744 50%, #2d3a4f 100%)',
    'partly-cloudy-day': 'linear-gradient(180deg, #6BA3D6 0%, #9AC4E8 50%, #C5DCF0 100%)',
    'partly-cloudy-night': 'linear-gradient(180deg, #1a2744 0%, #2d4a6a 50%, #3d5a7a 100%)',
    'cloudy': 'linear-gradient(180deg, #6B7B8C 0%, #8E9EAE 50%, #B5C5D5 100%)',
    'fog': 'linear-gradient(180deg, #9CA8B3 0%, #B5C0C9 50%, #D0D8DF 100%)',
    'rain': 'linear-gradient(180deg, #4A5568 0%, #6B7C8E 50%, #8E9EAE 100%)',
    'snow': 'linear-gradient(180deg, #C5D5E5 0%, #D5E5F0 50%, #E8F0F5 100%)',
    'thunderstorm': 'linear-gradient(180deg, #2D3748 0%, #4A5568 50%, #6B7C8E 100%)',
  };
  return { background: gradients[type] };
}

// Sun component for clear day
function SunnyDay() {
  return (
    <>
      {/* Sun */}
      <motion.div
        className="absolute top-8 right-8 w-20 h-20"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full rounded-full bg-yellow-300 shadow-[0_0_60px_20px_rgba(253,224,71,0.4)]" />
        {/* Sun rays */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-1 h-8 bg-yellow-200/60 origin-bottom"
            style={{ 
              transform: `translate(-50%, -100%) rotate(${i * 45}deg)`,
              transformOrigin: 'center bottom',
            }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
      
      {/* Floating clouds */}
      <FloatingCloud className="top-12 -left-10" delay={0} size="small" />
      <FloatingCloud className="top-24 right-1/4" delay={2} size="small" />
    </>
  );
}

// Stars and moon for night
function StarryNight() {
  const [stars] = useState(() => 
    [...Array(50)].map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 60,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
    }))
  );

  return (
    <>
      {/* Stars */}
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: star.delay }}
        />
      ))}
      
      {/* Moon */}
      <motion.div
        className="absolute top-8 right-8 w-16 h-16"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-300 shadow-[0_0_40px_10px_rgba(255,255,255,0.2)]" />
        {/* Moon craters */}
        <div className="absolute top-3 left-4 w-3 h-3 rounded-full bg-gray-200/50" />
        <div className="absolute top-8 left-8 w-2 h-2 rounded-full bg-gray-200/40" />
        <div className="absolute top-5 right-3 w-2 h-2 rounded-full bg-gray-200/30" />
      </motion.div>
      
      {/* Shooting star occasionally */}
      <motion.div
        className="absolute w-1 h-1 bg-white rounded-full"
        initial={{ top: '10%', left: '20%', opacity: 0 }}
        animate={{ 
          top: ['10%', '30%'],
          left: ['20%', '50%'],
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 8 }}
        style={{ boxShadow: '0 0 10px 2px white, -20px -10px 20px 2px rgba(255,255,255,0.5)' }}
      />
    </>
  );
}

// Partly cloudy variations
function PartlyCloudyDay() {
  return (
    <>
      <motion.div
        className="absolute top-6 right-12 w-14 h-14"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div className="w-full h-full rounded-full bg-yellow-300 shadow-[0_0_40px_15px_rgba(253,224,71,0.3)]" />
      </motion.div>
      <FloatingCloud className="top-4 right-4" delay={0} size="medium" />
      <FloatingCloud className="top-16 left-4" delay={1.5} size="large" />
      <FloatingCloud className="top-8 left-1/3" delay={3} size="small" />
    </>
  );
}

function PartlyCloudyNight() {
  const [stars] = useState(() => 
    [...Array(25)].map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 40,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
    }))
  );

  return (
    <>
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: star.delay }}
        />
      ))}
      <motion.div
        className="absolute top-6 right-16 w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 shadow-[0_0_30px_8px_rgba(255,255,255,0.15)]"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <FloatingCloud className="top-4 right-4" delay={0} size="medium" opacity={0.8} />
      <FloatingCloud className="top-12 left-8" delay={2} size="large" opacity={0.7} />
    </>
  );
}

// Cloudy
function Cloudy() {
  return (
    <>
      <FloatingCloud className="top-2 -left-8" delay={0} size="large" />
      <FloatingCloud className="top-8 right-0" delay={1} size="large" />
      <FloatingCloud className="top-16 left-1/4" delay={2} size="medium" />
      <FloatingCloud className="top-4 right-1/3" delay={1.5} size="medium" />
      <FloatingCloud className="top-20 right-1/4" delay={3} size="small" />
    </>
  );
}

// Fog
function Foggy() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-8 bg-white/30 rounded-full blur-xl"
          style={{
            top: `${15 + i * 15}%`,
            left: '-10%',
            width: '120%',
          }}
          animate={{ x: ['-5%', '5%', '-5%'] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

// Rain
function Rainy() {
  const [drops] = useState(() =>
    [...Array(30)].map(() => ({
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 0.5 + Math.random() * 0.5,
    }))
  );

  return (
    <>
      <FloatingCloud className="top-0 left-0" delay={0} size="large" opacity={0.9} />
      <FloatingCloud className="top-4 right-0" delay={0.5} size="large" opacity={0.9} />
      <FloatingCloud className="top-2 left-1/3" delay={1} size="medium" opacity={0.85} />
      
      {/* Rain drops */}
      {drops.map((drop, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-4 bg-blue-300/60 rounded-full"
          style={{ left: `${drop.x}%`, top: '-10%' }}
          animate={{ y: ['0%', '400%'], opacity: [0.6, 0] }}
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
}

// Snow
function Snowy() {
  const [flakes] = useState(() =>
    [...Array(40)].map(() => ({
      x: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 4,
    }))
  );

  return (
    <>
      <FloatingCloud className="top-0 -left-4" delay={0} size="large" opacity={0.95} />
      <FloatingCloud className="top-2 right-0" delay={0.5} size="large" opacity={0.95} />
      
      {/* Snowflakes */}
      {flakes.map((flake, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${flake.x}%`, top: '-5%', width: flake.size, height: flake.size }}
          animate={{
            y: ['0%', '350%'],
            x: [0, Math.sin(i) * 30, 0],
            rotate: [0, 360],
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
}

// Thunderstorm
function Thunderstorm() {
  const [lightning, setLightning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setLightning(true);
        setTimeout(() => setLightning(false), 150);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Lightning flash */}
      {lightning && (
        <div className="absolute inset-0 bg-white/30 z-10" />
      )}
      
      <Rainy />
    </>
  );
}

// Reusable cloud component
function FloatingCloud({ 
  className, 
  delay = 0, 
  size = 'medium',
  opacity = 1,
}: { 
  className?: string; 
  delay?: number; 
  size?: 'small' | 'medium' | 'large';
  opacity?: number;
}) {
  const sizeClasses = {
    small: 'w-16 h-8',
    medium: 'w-24 h-12',
    large: 'w-32 h-16',
  };

  return (
    <motion.div
      className={`absolute ${sizeClasses[size]} ${className}`}
      style={{ opacity }}
      animate={{ x: [0, 20, 0] }}
      transition={{ duration: 20 + delay * 2, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-lg">
        <ellipse cx="30" cy="35" rx="25" ry="15" fill="white" fillOpacity="0.9" />
        <ellipse cx="55" cy="30" rx="30" ry="20" fill="white" fillOpacity="0.95" />
        <ellipse cx="75" cy="35" rx="20" ry="12" fill="white" fillOpacity="0.9" />
        <ellipse cx="45" cy="20" rx="20" ry="15" fill="white" fillOpacity="0.85" />
      </svg>
    </motion.div>
  );
}
