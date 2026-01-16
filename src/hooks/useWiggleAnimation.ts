import { useEffect, useRef, useState } from "react";
import { MotionValue, animate } from "framer-motion";

interface UseWiggleAnimationOptions {
  /** MotionValue to animate */
  x: MotionValue<number>;
  /** Skip animation when true */
  disabled?: boolean;
  /** Initial delay before first wiggle (ms) */
  initialDelay?: number;
  /** Interval between wiggles (ms) */
  interval?: number;
  /** Check if slider is ready (has width) */
  isReady?: () => boolean;
}

/**
 * Hook that creates a repeating wiggle animation for slider hints.
 * Returns a function to stop the animation (e.g., when user interacts).
 */
export function useWiggleAnimation({
  x,
  disabled = false,
  initialDelay = 800,
  interval = 10000,
  isReady = () => true,
}: UseWiggleAnimationOptions) {
  const [hasWiggled, setHasWiggled] = useState(false);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (disabled || hasWiggled) return;

    const doWiggle = () => {
      if (!isReady() || isAnimatingRef.current) return;
      
      isAnimatingRef.current = true;
      
      animate(x, 24, {
        type: "spring",
        stiffness: 300,
        damping: 15,
        onComplete: () => {
          animate(x, 12, {
            type: "spring",
            stiffness: 400,
            damping: 20,
            onComplete: () => {
              animate(x, 18, {
                type: "spring",
                stiffness: 500,
                damping: 25,
                onComplete: () => {
                  animate(x, 0, {
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    onComplete: () => {
                      isAnimatingRef.current = false;
                    },
                  });
                },
              });
            },
          });
        },
      });
    };

    // Initial wiggle after short delay
    const initialTimer = setTimeout(doWiggle, initialDelay);

    // Repeat every interval
    const intervalTimer = setInterval(doWiggle, interval);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [disabled, hasWiggled, x, initialDelay, interval, isReady]);

  const stopWiggle = () => setHasWiggled(true);

  return { hasWiggled, stopWiggle };
}
