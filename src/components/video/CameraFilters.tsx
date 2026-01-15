import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type CameraFilterType = 'none' | 'party' | 'neon' | 'disco' | 'vintage' | 'cyberpunk';

interface CameraFilterProps {
  filter: CameraFilterType;
  className?: string;
}

// Filter definitions with CSS filters and overlay effects
export const CAMERA_FILTERS: Record<CameraFilterType, {
  name: string;
  emoji: string;
  cssFilter: string;
  hasOverlay: boolean;
}> = {
  none: {
    name: 'Normal',
    emoji: '📷',
    cssFilter: 'none',
    hasOverlay: false
  },
  party: {
    name: 'Party',
    emoji: '🎉',
    cssFilter: 'saturate(1.4) contrast(1.1) brightness(1.05)',
    hasOverlay: true
  },
  neon: {
    name: 'Neon',
    emoji: '💜',
    cssFilter: 'saturate(1.5) contrast(1.2) hue-rotate(10deg)',
    hasOverlay: true
  },
  disco: {
    name: 'Disco',
    emoji: '🪩',
    cssFilter: 'saturate(1.3) brightness(1.1)',
    hasOverlay: true
  },
  vintage: {
    name: 'Retro',
    emoji: '📼',
    cssFilter: 'sepia(0.3) saturate(1.2) contrast(1.1)',
    hasOverlay: true
  },
  cyberpunk: {
    name: 'Cyber',
    emoji: '🤖',
    cssFilter: 'saturate(1.6) contrast(1.3) hue-rotate(-10deg)',
    hasOverlay: true
  }
};

// Party filter overlay - colorful gradient sweep
const PartyOverlay = () => (
  <>
    <motion.div
      className="absolute inset-0 pointer-events-none mix-blend-overlay"
      animate={{
        background: [
          'linear-gradient(45deg, rgba(255,0,100,0.2) 0%, transparent 50%, rgba(0,200,255,0.2) 100%)',
          'linear-gradient(135deg, rgba(255,200,0,0.2) 0%, transparent 50%, rgba(255,0,200,0.2) 100%)',
          'linear-gradient(225deg, rgba(0,255,150,0.2) 0%, transparent 50%, rgba(255,100,0,0.2) 100%)',
          'linear-gradient(315deg, rgba(100,0,255,0.2) 0%, transparent 50%, rgba(255,255,0,0.2) 100%)',
          'linear-gradient(45deg, rgba(255,0,100,0.2) 0%, transparent 50%, rgba(0,200,255,0.2) 100%)',
        ]
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    />
    {/* Sparkle effect */}
    <motion.div
      className="absolute top-2 right-2 text-xl"
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      ✨
    </motion.div>
  </>
);

// Neon filter overlay - glowing border effect
const NeonOverlay = () => (
  <>
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{
        boxShadow: [
          'inset 0 0 30px rgba(168,85,247,0.4), inset 0 0 60px rgba(168,85,247,0.2)',
          'inset 0 0 40px rgba(236,72,153,0.4), inset 0 0 80px rgba(236,72,153,0.2)',
          'inset 0 0 30px rgba(59,130,246,0.4), inset 0 0 60px rgba(59,130,246,0.2)',
          'inset 0 0 30px rgba(168,85,247,0.4), inset 0 0 60px rgba(168,85,247,0.2)',
        ]
      }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute inset-0 pointer-events-none mix-blend-screen"
      animate={{
        background: [
          'radial-gradient(circle at 20% 20%, rgba(168,85,247,0.15) 0%, transparent 40%)',
          'radial-gradient(circle at 80% 80%, rgba(236,72,153,0.15) 0%, transparent 40%)',
          'radial-gradient(circle at 80% 20%, rgba(59,130,246,0.15) 0%, transparent 40%)',
          'radial-gradient(circle at 20% 80%, rgba(168,85,247,0.15) 0%, transparent 40%)',
          'radial-gradient(circle at 20% 20%, rgba(168,85,247,0.15) 0%, transparent 40%)',
        ]
      }}
      transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
    />
  </>
);

// Disco filter overlay - moving light beams
const DiscoOverlay = () => (
  <>
    {/* Disco ball reflections */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-4 h-4 rounded-full bg-white/40 blur-sm pointer-events-none"
        initial={{ 
          x: `${Math.random() * 100}%`, 
          y: `${Math.random() * 100}%`,
          opacity: 0 
        }}
        animate={{
          x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
          y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
          opacity: [0, 0.8, 0],
          scale: [0.5, 1.5, 0.5]
        }}
        transition={{ 
          duration: 2 + Math.random() * 2, 
          repeat: Infinity, 
          delay: i * 0.3,
          ease: 'easeInOut'
        }}
      />
    ))}
    {/* Color sweep */}
    <motion.div
      className="absolute inset-0 pointer-events-none mix-blend-color-dodge"
      animate={{
        background: [
          'linear-gradient(90deg, transparent 0%, rgba(255,0,0,0.1) 25%, transparent 50%)',
          'linear-gradient(90deg, transparent 25%, rgba(0,255,0,0.1) 50%, transparent 75%)',
          'linear-gradient(90deg, transparent 50%, rgba(0,0,255,0.1) 75%, transparent 100%)',
          'linear-gradient(90deg, transparent 0%, rgba(255,0,0,0.1) 25%, transparent 50%)',
        ]
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    />
  </>
);

// Vintage/Retro filter overlay
const VintageOverlay = () => (
  <>
    {/* Film grain effect */}
    <div 
      className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
      style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
      }}
    />
    {/* Vignette */}
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)'
      }}
    />
    {/* Warm tint */}
    <div className="absolute inset-0 pointer-events-none bg-amber-500/10 mix-blend-overlay" />
  </>
);

// Cyberpunk filter overlay
const CyberpunkOverlay = () => (
  <>
    {/* Scanlines */}
    <div 
      className="absolute inset-0 pointer-events-none opacity-10"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.1) 2px, rgba(0,255,255,0.1) 4px)',
      }}
    />
    {/* Glitch effect */}
    <motion.div
      className="absolute inset-0 pointer-events-none mix-blend-screen"
      animate={{
        clipPath: [
          'inset(0 0 95% 0)',
          'inset(80% 0 0 0)',
          'inset(0 0 0 0)',
          'inset(50% 0 40% 0)',
          'inset(0 0 95% 0)',
        ],
        x: [0, -2, 2, -1, 0]
      }}
      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
    >
      <div className="w-full h-full bg-cyan-500/20" />
    </motion.div>
    {/* Neon accents */}
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{
        boxShadow: [
          'inset 0 0 20px rgba(0,255,255,0.3)',
          'inset 0 0 30px rgba(255,0,255,0.3)',
          'inset 0 0 20px rgba(0,255,255,0.3)',
        ]
      }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </>
);

// Main overlay component that renders the appropriate filter
export const CameraFilterOverlay = ({ filter, className }: CameraFilterProps) => {
  if (filter === 'none' || !CAMERA_FILTERS[filter].hasOverlay) {
    return null;
  }

  return (
    <div className={cn("absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-10", className)}>
      {filter === 'party' && <PartyOverlay />}
      {filter === 'neon' && <NeonOverlay />}
      {filter === 'disco' && <DiscoOverlay />}
      {filter === 'vintage' && <VintageOverlay />}
      {filter === 'cyberpunk' && <CyberpunkOverlay />}
    </div>
  );
};

// Filter selector component
interface FilterSelectorProps {
  currentFilter: CameraFilterType;
  onFilterChange: (filter: CameraFilterType) => void;
}

export const FilterSelector = ({ currentFilter, onFilterChange }: FilterSelectorProps) => {
  const filters = Object.entries(CAMERA_FILTERS) as [CameraFilterType, typeof CAMERA_FILTERS[CameraFilterType]][];

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-center gap-1 py-2 px-2 overflow-x-auto"
    >
      {filters.map(([key, filter]) => (
        <motion.button
          key={key}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFilterChange(key)}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[60px]",
            currentFilter === key 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted/50 hover:bg-muted"
          )}
        >
          <span className="text-lg">{filter.emoji}</span>
          <span className="text-[10px] font-medium">{filter.name}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};

// Get CSS filter string for a given filter type
export const getVideoFilter = (filter: CameraFilterType): string => {
  return CAMERA_FILTERS[filter].cssFilter;
};
