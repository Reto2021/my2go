import React from 'react';
import { motion } from 'framer-motion';
import talerLogo from '@/assets/taler-logo-vinyl.png';

interface AnimatedVinylFallbackProps {
  isPlaying: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedVinylFallback({ isPlaying, size = 'lg' }: AnimatedVinylFallbackProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-full h-full'
  };

  return (
    <div className={`${sizeClasses[size]} relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-secondary via-black to-secondary`}>
      {/* Animated background particles/glow */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Ambient glow rings */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-[80%] h-[80%] rounded-full bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 blur-xl" />
        </motion.div>
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-accent/40"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, Math.random() * 10 - 5, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Main vinyl disc */}
      <motion.div
        className="relative w-[85%] h-[85%] rounded-full"
        animate={isPlaying ? { rotate: 360 } : {}}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Outer vinyl ring - glossy black with grooves */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-800 shadow-2xl">
          {/* Vinyl grooves effect */}
          <div className="absolute inset-[5%] rounded-full border border-white/5" />
          <div className="absolute inset-[10%] rounded-full border border-white/5" />
          <div className="absolute inset-[15%] rounded-full border border-white/5" />
          <div className="absolute inset-[20%] rounded-full border border-white/5" />
          <div className="absolute inset-[22%] rounded-full border border-white/5" />
          <div className="absolute inset-[24%] rounded-full border border-white/5" />
          
          {/* Vinyl shine/reflection */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
        </div>

        {/* Center label with 2Go Taler logo */}
        <div className="absolute inset-[28%] rounded-full overflow-hidden bg-gradient-to-br from-accent via-primary to-accent shadow-inner flex items-center justify-center">
          {/* Logo container */}
          <motion.div
            className="w-[90%] h-[90%] rounded-full overflow-hidden bg-white flex items-center justify-center p-2"
            animate={isPlaying ? { rotate: -360 } : {}}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <img 
              src={talerLogo} 
              alt="2Go Taler" 
              className="w-full h-full object-contain"
            />
          </motion.div>
          
          {/* Center spindle hole */}
          <div className="absolute inset-[42%] rounded-full bg-black/80 shadow-inner" />
        </div>
      </motion.div>

      {/* Audio visualizer bars at bottom */}
      {isPlaying && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 bg-gradient-to-t from-accent to-primary rounded-full"
              animate={{
                height: [
                  `${20 + Math.random() * 30}%`,
                  `${60 + Math.random() * 40}%`,
                  `${30 + Math.random() * 40}%`,
                  `${70 + Math.random() * 30}%`,
                  `${20 + Math.random() * 30}%`,
                ],
              }}
              transition={{
                duration: 0.8 + Math.random() * 0.4,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.05,
              }}
            />
          ))}
        </div>
      )}

      {/* Glow effect when playing */}
      {isPlaying && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 20px 0 rgba(var(--accent-rgb), 0.2)',
              '0 0 40px 10px rgba(var(--accent-rgb), 0.3)',
              '0 0 20px 0 rgba(var(--accent-rgb), 0.2)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  );
}
