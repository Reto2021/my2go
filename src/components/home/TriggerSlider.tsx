import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TRIGGERS = [
  "Gönn dir einen Kaffee.",
  "Geniesse ein Dessert.",
  "Mach's zum Apéro.",
  "Hol dir den Lunch.",
  "Stoss regional an.",
  "Degustiere lokalen Wein.",
  "Geh ins Museum.",
  "Entdecke Geschichte live.",
  "Bleib länger im Bad.",
  "Gönn dir Wellness.",
  "Tu dir etwas Gutes.",
  "Trainiere mit Vorteil.",
  "Hol dir neue Energie.",
  "Check deine Sicht.",
  "Bring Ordnung in die Finanzen.",
  "Mach den Auto-Service.",
  "Hol dir ein neues Outfit.",
  "Ein Buch geht immer.",
  "Schreib's dir schön.",
  "Mach Kultur spontan.",
  "Entdeck Brugg neu.",
  "Mach Pause am Wasser.",
  "Shop lokal smarter.",
  "Lesezeit für dich.",
];

// Shuffle array on mount for randomness
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function TriggerSlider() {
  const [shuffledTriggers] = useState(() => shuffleArray(TRIGGERS));
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTrigger = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % shuffledTriggers.length);
  }, [shuffledTriggers.length]);

  useEffect(() => {
    const interval = setInterval(nextTrigger, 6000);
    return () => clearInterval(interval);
  }, [nextTrigger]);

  return (
    <span className="relative inline-block mt-1">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.22, 1, 0.36, 1] 
          }}
          className="relative inline-flex items-center"
        >
          {/* Brush stroke background with rough edges */}
          <span 
            className="absolute bg-accent -rotate-1"
            style={{ 
              left: '-0.75rem', 
              right: '-0.75rem', 
              top: '-0.15rem', 
              bottom: '-0.15rem',
              borderRadius: '4px 8px 6px 10px',
              clipPath: 'polygon(2% 15%, 0% 50%, 1% 85%, 4% 100%, 15% 98%, 30% 100%, 50% 97%, 70% 100%, 85% 99%, 96% 100%, 100% 80%, 99% 50%, 100% 20%, 97% 0%, 80% 2%, 60% 0%, 40% 3%, 20% 0%, 5% 1%)'
            }} 
          />
          <span className="relative text-secondary font-black whitespace-nowrap">
            {shuffledTriggers[currentIndex]}
          </span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
