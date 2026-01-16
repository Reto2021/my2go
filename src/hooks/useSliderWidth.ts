import { useEffect, useRef, useState } from "react";
import { MotionValue } from "framer-motion";

interface UseSliderWidthOptions {
  /** MotionValue to track for progress calculation */
  x: MotionValue<number>;
  /** Padding to subtract from container width (e.g., thumb width) */
  padding?: number;
}

/**
 * Hook to measure slider container width and calculate drag progress.
 */
export function useSliderWidth({ x, padding = 72 }: UseSliderWidthOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderWidthRef = useRef(0);
  const [progress, setProgress] = useState(0);

  // Calculate slider width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        sliderWidthRef.current = containerRef.current.offsetWidth - padding;
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [padding]);

  // Update progress based on x position
  useEffect(() => {
    const unsubscribe = x.on("change", (latest) => {
      if (sliderWidthRef.current > 0) {
        setProgress(Math.min(1, Math.max(0, latest / sliderWidthRef.current)));
      }
    });
    return () => unsubscribe();
  }, [x]);

  return {
    containerRef,
    sliderWidth: sliderWidthRef,
    progress,
    setProgress,
  };
}
