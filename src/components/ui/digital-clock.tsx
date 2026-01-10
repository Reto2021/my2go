import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DigitalClockProps {
  className?: string;
  showSeconds?: boolean;
  weatherDescription?: string;
  temperature?: number;
}

export function DigitalClock({ 
  className, 
  showSeconds = false,
  weatherDescription,
  temperature,
}: DigitalClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Time */}
      <motion.div 
        className="font-mono text-2xl font-bold tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span>{hours}</span>
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          :
        </motion.span>
        <span>{minutes}</span>
        {showSeconds && (
          <>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              :
            </motion.span>
            <span className="text-lg">{seconds}</span>
          </>
        )}
      </motion.div>

      {/* Divider */}
      {(weatherDescription || temperature !== undefined) && (
        <div className="w-px h-6 bg-white/30" />
      )}

      {/* Weather info */}
      {(weatherDescription || temperature !== undefined) && (
        <div className="flex items-center gap-2">
          {temperature !== undefined && (
            <span className="text-lg font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              {temperature}°C
            </span>
          )}
          {weatherDescription && (
            <span className="text-sm text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
              {weatherDescription}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
