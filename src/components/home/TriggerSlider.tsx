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
    const interval = setInterval(nextTrigger, 2500);
    return () => clearInterval(interval);
  }, [nextTrigger]);

  return (
    <span className="relative inline-block">
      <span className="absolute -inset-x-3 -inset-y-1 bg-accent rounded-lg -rotate-1" />
      <span className="relative text-secondary font-black inline-flex items-center justify-center min-w-[200px] sm:min-w-[280px]">
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.22, 1, 0.36, 1] 
            }}
            className="block whitespace-nowrap"
          >
            {shuffledTriggers[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
