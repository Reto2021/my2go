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
          <span className="absolute inset-0 bg-accent rounded-lg -rotate-1 -mx-4 -my-1 scale-x-110" style={{ left: '-1rem', right: '-1rem', top: '-0.25rem', bottom: '-0.25rem' }} />
          <span className="relative text-secondary font-black whitespace-nowrap px-2">
            {shuffledTriggers[currentIndex]}
          </span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
