import { useEffect, useRef, useState } from "react";

interface UseSessionLockOptions {
  /** Lock duration in seconds */
  duration?: number;
}

/**
 * Hook to manage a timed lock state (e.g., after claiming a streak bonus).
 */
export function useSessionLock({ duration = 65 }: UseSessionLockOptions = {}) {
  const [isLocked, setIsLocked] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startLock = () => {
    setIsLocked(true);
    setRemaining(duration);

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelLock = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsLocked(false);
    setRemaining(0);
  };

  return {
    isLocked,
    lockRemaining: remaining,
    startLock,
    cancelLock,
  };
}
