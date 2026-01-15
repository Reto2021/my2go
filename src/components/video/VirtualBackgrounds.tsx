import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';
import { preloadSegmentationModel, isWebGPUAvailable } from '@/lib/background-removal';

// Virtual background types and presets
export type VirtualBackgroundType = 'none' | 'blur' | 'ai-remove' | 'stage' | 'disco' | 'beach' | 'space' | 'neon-city';

export interface VirtualBackground {
  id: VirtualBackgroundType;
  name: string;
  emoji: string;
  gradient?: string;
  imageUrl?: string;
  isAI?: boolean;
}

export const VIRTUAL_BACKGROUNDS: Record<VirtualBackgroundType, VirtualBackground> = {
  none: { id: 'none', name: 'Kein', emoji: '🚫' },
  blur: { id: 'blur', name: 'Weichzeichner', emoji: '🌫️' },
  'ai-remove': { 
    id: 'ai-remove', 
    name: 'AI Entfernen', 
    emoji: '✨',
    isAI: true
  },
  stage: { 
    id: 'stage', 
    name: 'Bühne', 
    emoji: '🎤',
    gradient: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)'
  },
  disco: { 
    id: 'disco', 
    name: 'Disco', 
    emoji: '🪩',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)'
  },
  beach: { 
    id: 'beach', 
    name: 'Strand', 
    emoji: '🏖️',
    gradient: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 40%, #f5deb3 40%, #f5deb3 100%)'
  },
  space: { 
    id: 'space', 
    name: 'Weltall', 
    emoji: '🌌',
    gradient: 'linear-gradient(180deg, #0c0c1e 0%, #1a1a3e 50%, #2d1b4e 100%)'
  },
  'neon-city': { 
    id: 'neon-city', 
    name: 'Neon City', 
    emoji: '🌃',
    gradient: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
  }
};

interface BackgroundSelectorProps {
  currentBackground: VirtualBackgroundType;
  onBackgroundChange: (bg: VirtualBackgroundType) => void;
  isProcessing?: boolean;
  onAIBackgroundSelect?: () => void;
}

export const BackgroundSelector = ({ 
  currentBackground, 
  onBackgroundChange,
  isProcessing,
  onAIBackgroundSelect
}: BackgroundSelectorProps) => {
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Check WebGPU availability and preload model
    isWebGPUAvailable().then(available => {
      setIsAIAvailable(available);
      if (available) {
        preloadSegmentationModel();
      }
    });
  }, []);

  const handleBackgroundSelect = (bg: VirtualBackgroundType) => {
    if (bg === 'ai-remove' && onAIBackgroundSelect) {
      onAIBackgroundSelect();
    }
    onBackgroundChange(bg);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-3 px-2"
    >
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {Object.values(VIRTUAL_BACKGROUNDS).map((bg) => {
          // Skip AI option if not available
          if (bg.isAI && isAIAvailable === false) return null;
          
          return (
            <motion.button
              key={bg.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleBackgroundSelect(bg.id)}
              disabled={isProcessing || (bg.isAI && isAIAvailable === null)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-w-[60px]",
                currentBackground === bg.id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted/50 hover:bg-muted",
                isProcessing && "opacity-50 cursor-not-allowed",
                bg.isAI && "border border-purple-500/50"
              )}
            >
              {bg.isAI ? (
                <Sparkles className="h-5 w-5 text-purple-400" />
              ) : (
                <span className="text-xl">{bg.emoji}</span>
              )}
              <span className="text-[10px] font-medium">{bg.name}</span>
              {bg.isAI && isAIAvailable === null && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
            </motion.button>
          );
        })}
      </div>
      {isProcessing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          AI verarbeitet Hintergrund...
        </motion.div>
      )}
    </motion.div>
  );
};

// Background overlay component for video tiles
interface BackgroundOverlayProps {
  background: VirtualBackgroundType;
  className?: string;
}

export const BackgroundOverlay = ({ background, className }: BackgroundOverlayProps) => {
  if (background === 'none') return null;
  
  const bg = VIRTUAL_BACKGROUNDS[background];
  
  if (background === 'blur') {
    return (
      <div 
        className={cn("absolute inset-0 backdrop-blur-md -z-10", className)}
      />
    );
  }

  return (
    <div 
      className={cn("absolute inset-0 -z-10", className)}
      style={{ background: bg.gradient }}
    >
      {/* Animated elements for specific backgrounds */}
      {background === 'disco' && <DiscoLights />}
      {background === 'space' && <SpaceStars />}
      {background === 'neon-city' && <NeonCityLights />}
      {background === 'stage' && <StageLights />}
      {background === 'beach' && <BeachWaves />}
    </div>
  );
};

// Animated background effects
const DiscoLights = () => (
  <div className="absolute inset-0 overflow-hidden">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-32 h-32 rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle, ${['#ff00ff', '#00ffff', '#ffff00', '#ff00aa', '#00ff00', '#ff6600'][i]} 0%, transparent 70%)`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -40, 60, 0],
          scale: [1, 1.3, 0.8, 1],
          opacity: [0.3, 0.6, 0.2, 0.3],
        }}
        transition={{
          duration: 3 + i * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
    {/* Disco ball reflection */}
    <motion.div
      className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/80"
      animate={{ 
        boxShadow: [
          '0 0 20px #fff, 0 0 40px #ff00ff',
          '0 0 30px #fff, 0 0 60px #00ffff',
          '0 0 20px #fff, 0 0 40px #ffff00',
        ]
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  </div>
);

const SpaceStars = () => (
  <div className="absolute inset-0 overflow-hidden">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-white rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          opacity: [0.2, 1, 0.2],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 1 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
    {/* Shooting star */}
    <motion.div
      className="absolute w-1 h-1 bg-white rounded-full"
      style={{ boxShadow: '0 0 4px #fff, -20px 0 10px rgba(255,255,255,0.5)' }}
      animate={{
        x: ['-10%', '120%'],
        y: ['10%', '40%'],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatDelay: 5,
      }}
    />
  </div>
);

const NeonCityLights = () => (
  <div className="absolute inset-0 overflow-hidden">
    {/* City skyline silhouette */}
    <div className="absolute bottom-0 left-0 right-0 h-1/3 flex items-end justify-around">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bg-black/80"
          style={{
            width: `${8 + Math.random() * 10}%`,
            height: `${40 + Math.random() * 60}%`,
          }}
        />
      ))}
    </div>
    {/* Neon signs */}
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-8 rounded-full"
        style={{
          background: ['#ff00ff', '#00ffff', '#ff6b6b', '#ffd93d'][i],
          left: `${20 + i * 20}%`,
          bottom: `${10 + Math.random() * 20}%`,
          boxShadow: `0 0 10px ${['#ff00ff', '#00ffff', '#ff6b6b', '#ffd93d'][i]}`,
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 0.5 + i * 0.2, repeat: Infinity }}
      />
    ))}
  </div>
);

const StageLights = () => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Spotlight beams */}
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute top-0 w-20 h-full opacity-20"
        style={{
          background: `linear-gradient(180deg, ${['#ff6b6b', '#4ecdc4', '#ffe66d'][i]} 0%, transparent 60%)`,
          left: `${20 + i * 25}%`,
          transformOrigin: 'top center',
        }}
        animate={{
          rotate: [-10, 10, -10],
        }}
        transition={{
          duration: 3 + i,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
    {/* Floor reflection */}
    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-white/10 to-transparent" />
  </div>
);

const BeachWaves = () => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Sun */}
    <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-yellow-300 opacity-80" 
         style={{ boxShadow: '0 0 40px rgba(255, 200, 0, 0.5)' }} />
    {/* Waves */}
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute left-0 right-0 h-4 bg-blue-400/30 rounded-full"
        style={{ bottom: `${40 + i * 3}%` }}
        animate={{
          x: [-10, 10, -10],
          scaleX: [1, 1.05, 1],
        }}
        transition={{
          duration: 2 + i * 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
    {/* Palm tree silhouette */}
    <div className="absolute bottom-[40%] left-4 w-1 h-20 bg-green-900/60" />
    <div className="absolute bottom-[55%] left-2 w-8 h-4 bg-green-700/60 rounded-full transform -rotate-12" />
  </div>
);

export default BackgroundSelector;
