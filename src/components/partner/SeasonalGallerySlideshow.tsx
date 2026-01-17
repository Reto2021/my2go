import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  Snowflake,
  Sun,
  PartyPopper,
  Flower2,
  Leaf,
  Ghost,
  Heart,
  Egg,
  Flame,
  Flag,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logo2Go from '@/assets/logo-2go.png';

interface SeasonalTemplate {
  id: string;
  title: string;
  season: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  accentColor: string;
  pattern: React.ReactNode;
  tagline: string;
}

interface SeasonalGallerySlideshowProps {
  partnerName: string;
  qrUrl: string;
}

const seasonalTemplates: SeasonalTemplate[] = [
  {
    id: 'christmas',
    title: 'Weihnachts-Edition',
    season: 'Winter',
    icon: Snowflake,
    gradient: 'from-red-600 via-red-700 to-green-800',
    accentColor: 'text-yellow-300',
    pattern: (
      <>
        {[...Array(12)].map((_, i) => (
          <Snowflake 
            key={i} 
            className="absolute text-white/20 animate-pulse"
            style={{
              left: `${10 + (i * 8)}%`,
              top: `${5 + (i % 4) * 25}%`,
              width: `${12 + (i % 3) * 8}px`,
              height: `${12 + (i % 3) * 8}px`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </>
    ),
    tagline: 'Frohe Festtage!'
  },
  {
    id: 'valentine',
    title: 'Valentinstag',
    season: 'Februar',
    icon: Heart,
    gradient: 'from-rose-500 via-pink-500 to-red-400',
    accentColor: 'text-white',
    pattern: (
      <>
        {[...Array(15)].map((_, i) => (
          <Heart 
            key={i} 
            className="absolute text-white/15 fill-white/10"
            style={{
              left: `${5 + (i * 6.5)}%`,
              top: `${8 + (i % 5) * 18}%`,
              width: `${10 + (i % 4) * 6}px`,
              height: `${10 + (i % 4) * 6}px`,
              transform: `rotate(${-15 + (i * 5)}deg)`
            }}
          />
        ))}
      </>
    ),
    tagline: 'Mit Liebe gemacht ❤️'
  },
  {
    id: 'carnival',
    title: 'Fasnacht',
    season: 'Fasnacht',
    icon: PartyPopper,
    gradient: 'from-violet-600 via-fuchsia-500 to-yellow-400',
    accentColor: 'text-white',
    pattern: (
      <>
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 90}%`,
              top: `${Math.random() * 90}%`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#7B68EE'][i % 5],
              opacity: 0.6
            }}
          />
        ))}
      </>
    ),
    tagline: 'Konfetti & Taler! 🎭'
  },
  {
    id: 'easter',
    title: 'Oster-Edition',
    season: 'Ostern',
    icon: Egg,
    gradient: 'from-yellow-300 via-lime-300 to-pink-300',
    accentColor: 'text-purple-700',
    pattern: (
      <>
        {[...Array(8)].map((_, i) => (
          <Egg 
            key={i} 
            className="absolute text-white/30"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${15 + (i % 3) * 30}%`,
              width: `${18 + (i % 3) * 8}px`,
              height: `${18 + (i % 3) * 8}px`,
              transform: `rotate(${-20 + (i * 10)}deg)`
            }}
          />
        ))}
      </>
    ),
    tagline: 'Frohe Ostern! 🐰'
  },
  {
    id: 'spring',
    title: 'Frühlings-Edition',
    season: 'Frühling',
    icon: Flower2,
    gradient: 'from-pink-400 via-rose-300 to-green-400',
    accentColor: 'text-white',
    pattern: (
      <>
        {[...Array(10)].map((_, i) => (
          <Flower2 
            key={i} 
            className="absolute text-white/25"
            style={{
              left: `${8 + (i * 10)}%`,
              top: `${10 + (i % 4) * 22}%`,
              width: `${14 + (i % 3) * 6}px`,
              height: `${14 + (i % 3) * 6}px`,
              transform: `rotate(${i * 36}deg)`
            }}
          />
        ))}
      </>
    ),
    tagline: 'Frühlingsgefühle 🌸'
  },
  {
    id: 'midsummer',
    title: 'Midsummer',
    season: 'Juni',
    icon: Sun,
    gradient: 'from-yellow-400 via-amber-400 to-sky-400',
    accentColor: 'text-indigo-700',
    pattern: (
      <>
        {[...Array(6)].map((_, i) => (
          <Sun 
            key={i} 
            className="absolute text-white/20"
            style={{
              left: `${15 + (i * 15)}%`,
              top: `${20 + (i % 3) * 25}%`,
              width: `${20 + (i % 2) * 10}px`,
              height: `${20 + (i % 2) * 10}px`
            }}
          />
        ))}
      </>
    ),
    tagline: 'Sommerfest-Vibes ☀️'
  },
  {
    id: 'summer',
    title: 'Sommer-Aktion',
    season: 'Sommer',
    icon: Sun,
    gradient: 'from-orange-400 via-yellow-400 to-cyan-400',
    accentColor: 'text-white',
    pattern: (
      <>
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-cyan-500/30 to-transparent" />
        {[...Array(5)].map((_, i) => (
          <Sun 
            key={i} 
            className="absolute text-yellow-200/30"
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${10 + (i % 2) * 20}%`,
              width: `${24 + (i % 2) * 8}px`,
              height: `${24 + (i % 2) * 8}px`
            }}
          />
        ))}
      </>
    ),
    tagline: 'Heisse Sommer-Deals 🌴'
  },
  {
    id: 'swiss-national',
    title: '1. August',
    season: 'August',
    icon: Flag,
    gradient: 'from-red-600 via-red-500 to-red-700',
    accentColor: 'text-white',
    pattern: (
      <>
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-24 bg-white" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-8 bg-white" />
            </div>
          </div>
        </div>
      </>
    ),
    tagline: 'Hopp Schwiiz! 🇨🇭'
  },
  {
    id: 'autumn',
    title: 'Herbst-Edition',
    season: 'Herbst',
    icon: Leaf,
    gradient: 'from-orange-500 via-amber-600 to-red-700',
    accentColor: 'text-yellow-200',
    pattern: (
      <>
        {[...Array(12)].map((_, i) => (
          <Leaf 
            key={i} 
            className="absolute text-yellow-400/20"
            style={{
              left: `${5 + (i * 8)}%`,
              top: `${10 + (i % 4) * 22}%`,
              width: `${12 + (i % 3) * 6}px`,
              height: `${12 + (i % 3) * 6}px`,
              transform: `rotate(${-30 + (i * 15)}deg)`
            }}
          />
        ))}
      </>
    ),
    tagline: 'Goldener Herbst 🍂'
  },
  {
    id: 'halloween',
    title: 'Halloween',
    season: 'Oktober',
    icon: Ghost,
    gradient: 'from-orange-600 via-purple-900 to-black',
    accentColor: 'text-orange-400',
    pattern: (
      <>
        {[...Array(8)].map((_, i) => (
          <Ghost 
            key={i} 
            className="absolute text-white/15"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${15 + (i % 3) * 28}%`,
              width: `${14 + (i % 3) * 8}px`,
              height: `${14 + (i % 3) * 8}px`
            }}
          />
        ))}
      </>
    ),
    tagline: 'Trick or Taler! 🎃'
  },
  {
    id: 'anniversary',
    title: 'Jubiläums-Template',
    season: 'Ganzjährig',
    icon: Calendar,
    gradient: 'from-amber-500 via-purple-500 to-pink-500',
    accentColor: 'text-white',
    pattern: (
      <>
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="absolute"
            style={{
              left: `${Math.random() * 90}%`,
              top: `${Math.random() * 90}%`,
              width: '2px',
              height: `${8 + Math.random() * 16}px`,
              backgroundColor: '#FFD700',
              opacity: 0.4,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          />
        ))}
      </>
    ),
    tagline: 'Wir feiern! 🎊'
  }
];

export function SeasonalGallerySlideshow({ partnerName, qrUrl }: SeasonalGallerySlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState(0);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % seasonalTemplates.length);
  }, []);

  const goToPrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + seasonalTemplates.length) % seasonalTemplates.length);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isPlaying, goToNext]);

  const currentTemplate = seasonalTemplates[currentIndex];
  const IconComponent = currentTemplate.icon;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.9
    })
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-card border shadow-xl">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm font-medium ml-2">Saisonale Vorlagen-Galerie</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Slideshow Content */}
      <div className="relative h-[400px] overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-6",
              `bg-gradient-to-br ${currentTemplate.gradient}`
            )}
          >
            {/* Pattern Background */}
            <div className="absolute inset-0 overflow-hidden">
              {currentTemplate.pattern}
            </div>

            {/* Content */}
            <div className="relative z-10 text-center text-white">
              {/* Season Badge */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4"
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-sm font-medium">{currentTemplate.season}</span>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-2xl font-bold mb-2"
              >
                {currentTemplate.title}
              </motion.h2>

              {/* Tagline */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={cn("text-lg font-medium mb-6", currentTemplate.accentColor)}
              >
                {currentTemplate.tagline}
              </motion.p>

              {/* QR Code */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="bg-white p-3 rounded-xl shadow-2xl inline-block mb-4"
              >
                <QRCodeSVG 
                  value={qrUrl || 'https://my2go.ch'} 
                  size={100}
                  level="H"
                />
              </motion.div>

              {/* Partner Name */}
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-base font-semibold"
              >
                {partnerName}
              </motion.p>

              {/* Logo */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-3"
              >
                <img src={logo2Go} alt="My 2Go" className="h-6 mx-auto opacity-90" />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicators */}
      <div className="bg-muted/50 px-4 py-3 border-t">
        <div className="flex items-center justify-center gap-2">
          {seasonalTemplates.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-6 bg-primary" 
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          {currentIndex + 1} / {seasonalTemplates.length} – Klicke auf eine Vorlage oben um sie herunterzuladen
        </p>
      </div>
    </div>
  );
}
