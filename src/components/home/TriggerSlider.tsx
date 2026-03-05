import { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useRegion } from '@/hooks/useRegion';

// Fallback triggers when DB is empty or loading
const FALLBACK_TRIGGERS = [
  "Gönn dir einen Kaffee.",
  "Geniesse ein Dessert.",
  "Mach's zum Apéro.",
  "Hol dir den Lunch.",
  "Stoss regional an.",
  "Tu dir etwas Gutes.",
  "Shop lokal smarter.",
  "Entdeck deine Stadt neu.",
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function TriggerSlider() {
  const { region } = useRegion();
  const [slides, setSlides] = useState<string[]>([]);
  const shouldReduceMotion = useReducedMotion();

  // Load slides from DB
  useEffect(() => {
    let cancelled = false;

    async function loadSlides() {
      try {
        // Fetch slides for this region OR global (region_id IS NULL)
        let query = supabase
          .from('trigger_slides')
          .select('text, priority, region_id')
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (region?.id) {
          query = query.or(`region_id.eq.${region.id},region_id.is.null`);
        } else {
          query = query.is('region_id', null);
        }

        const { data, error } = await query;

        if (!cancelled) {
          if (error || !data?.length) {
            setSlides(shuffleArray(FALLBACK_TRIGGERS));
          } else {
            setSlides(shuffleArray(data.map((s) => s.text)));
          }
        }
      } catch {
        if (!cancelled) {
          setSlides(shuffleArray(FALLBACK_TRIGGERS));
        }
      }
    }

    loadSlides();
    return () => { cancelled = true; };
  }, [region?.id]);

  // Use fallback while loading
  const displaySlides = useMemo(
    () => (slides.length > 0 ? slides : FALLBACK_TRIGGERS),
    [slides]
  );

  const tickerText = useMemo(
    () => [...displaySlides, ...displaySlides].join('   •   '),
    [displaySlides]
  );

  const marqueeDuration = useMemo(
    () => Math.max(20, tickerText.length * 0.22),
    [tickerText]
  );

  return (
    <span className="relative block mt-1 overflow-hidden">
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

      <span className="relative block overflow-hidden px-2">
        <motion.span
          className="inline-block whitespace-nowrap text-secondary font-black"
          animate={shouldReduceMotion ? { x: 0 } : { x: ['0%', '-50%'] }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  duration: marqueeDuration,
                  ease: 'linear',
                  repeat: Infinity,
                }
          }
        >
          {tickerText}
        </motion.span>
      </span>
    </span>
  );
}
