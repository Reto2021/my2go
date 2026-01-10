import { useEffect, useState, useRef } from 'react';

interface ListenerPresence {
  count: number;
  isConnected: boolean;
}

/**
 * Simuliert realistische Hörerzahlen basierend auf Schweizer Radioverhalten
 * Referenz: Mediapulse Schweiz - typische Tagesverläufe
 * 
 * Basis: 50'000 tägliche Hörer (Tagesreichweite)
 * Die momentane Hörerzahl variiert stark nach Tageszeit
 */

// Schweizer Radio-Hörverhalten nach Mediapulse (Marktanteil pro Stunde)
const HOURLY_LISTENING_CURVE: Record<number, number> = {
  0: 0.008,
  1: 0.005,
  2: 0.003,
  3: 0.002,
  4: 0.003,
  5: 0.015,
  6: 0.045,
  7: 0.085,
  8: 0.095,
  9: 0.075,
  10: 0.055,
  11: 0.050,
  12: 0.065,
  13: 0.055,
  14: 0.045,
  15: 0.050,
  16: 0.060,
  17: 0.075,
  18: 0.070,
  19: 0.055,
  20: 0.040,
  21: 0.030,
  22: 0.020,
  23: 0.012,
};

// Wochentag-Faktoren
const WEEKDAY_FACTORS: Record<number, number> = {
  0: 0.70,  // Sonntag
  1: 1.00,  // Montag
  2: 1.00,  // Dienstag
  3: 1.00,  // Mittwoch
  4: 1.00,  // Donnerstag
  5: 0.95,  // Freitag
  6: 0.75,  // Samstag
};

const DAILY_REACH = 50000;

function getSimulatedListenerCount(): number {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const minutes = now.getMinutes();
  
  const currentHourFactor = HOURLY_LISTENING_CURVE[hour] ?? 0.05;
  const nextHourFactor = HOURLY_LISTENING_CURVE[(hour + 1) % 24] ?? 0.05;
  const interpolatedFactor = currentHourFactor + (nextHourFactor - currentHourFactor) * (minutes / 60);
  
  const weekdayFactor = WEEKDAY_FACTORS[dayOfWeek] ?? 1;
  const baseCount = Math.round(DAILY_REACH * interpolatedFactor * weekdayFactor);
  
  const variation = 1 + (Math.random() - 0.5) * 0.16;
  const microVariation = Math.floor(Math.random() * 50) - 25;
  
  return Math.max(100, Math.round(baseCount * variation) + microVariation);
}

function formatListenerCount(count: number): string {
  if (count >= 1000) {
    const thousands = count / 1000;
    if (thousands < 10) {
      return `${thousands.toFixed(1).replace('.', ',')}k`;
    }
    return `${Math.round(thousands)}k`;
  }
  return count.toString();
}

export function useLiveListeners(): ListenerPresence & { formattedCount: string } {
  const [count, setCount] = useState(2500);
  const [isConnected, setIsConnected] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initiale Verbindung simulieren
  useEffect(() => {
    const connectDelay = setTimeout(() => {
      setIsConnected(true);
      setCount(getSimulatedListenerCount());
    }, 800);

    return () => clearTimeout(connectDelay);
  }, []);

  // Regelmässige Updates
  useEffect(() => {
    if (!isConnected) return;

    const scheduleUpdate = () => {
      const delay = 3000 + Math.random() * 5000;
      timeoutRef.current = setTimeout(() => {
        setCount(prevCount => {
          const newCount = getSimulatedListenerCount();
          return Math.round(prevCount * 0.7 + newCount * 0.3);
        });
        scheduleUpdate();
      }, delay);
    };

    scheduleUpdate();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isConnected]);

  return { 
    count, 
    isConnected,
    formattedCount: formatListenerCount(count)
  };
}
