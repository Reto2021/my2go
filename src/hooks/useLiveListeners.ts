import { useEffect, useState, useRef } from 'react';

// Schweizer Radio-Hörverhalten nach Mediapulse (Marktanteil pro Stunde)
const HOURLY_CURVE: Record<number, number> = {
  0: 0.008, 1: 0.005, 2: 0.003, 3: 0.002, 4: 0.003, 5: 0.015,
  6: 0.045, 7: 0.085, 8: 0.095, 9: 0.075, 10: 0.055, 11: 0.050,
  12: 0.065, 13: 0.055, 14: 0.045, 15: 0.050, 16: 0.060, 17: 0.075,
  18: 0.070, 19: 0.055, 20: 0.040, 21: 0.030, 22: 0.020, 23: 0.012,
};

const WEEKDAY_MULT: Record<number, number> = {
  0: 0.70, 1: 1.00, 2: 1.00, 3: 1.00, 4: 1.00, 5: 0.95, 6: 0.75,
};

const DAILY_REACH = 50000;

function calcListeners(): number {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const d = now.getDay();
  
  const curr = HOURLY_CURVE[h] ?? 0.05;
  const next = HOURLY_CURVE[(h + 1) % 24] ?? 0.05;
  const factor = curr + (next - curr) * (m / 60);
  const weekday = WEEKDAY_MULT[d] ?? 1;
  
  const base = DAILY_REACH * factor * weekday;
  const variation = 1 + (Math.random() - 0.5) * 0.16;
  const micro = Math.floor(Math.random() * 50) - 25;
  
  return Math.max(100, Math.round(base * variation) + micro);
}

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k < 10 ? `${k.toFixed(1).replace('.', ',')}k` : `${Math.round(k)}k`;
  }
  return n.toString();
}

interface UseLiveListenersResult {
  count: number;
  isConnected: boolean;
  formattedCount: string;
}

export function useLiveListeners(): UseLiveListenersResult {
  const [count, setCount] = useState(2500);
  const [isConnected, setIsConnected] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const delay = setTimeout(() => {
      setIsConnected(true);
      setCount(calcListeners());
    }, 800);
    return () => clearTimeout(delay);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    function tick() {
      timerRef.current = window.setTimeout(() => {
        setCount(prev => Math.round(prev * 0.7 + calcListeners() * 0.3));
        tick();
      }, 3000 + Math.random() * 5000);
    }
    
    tick();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isConnected]);

  return { count, isConnected, formattedCount: formatCount(count) };
}
