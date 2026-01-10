import { useEffect, useState, useCallback } from 'react';

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
// Werte repräsentieren den relativen Anteil der Tagesreichweite, die zu dieser Stunde hört
const HOURLY_LISTENING_CURVE: Record<number, number> = {
  0: 0.008,   // 00:00 - Nacht, sehr wenige
  1: 0.005,   // 01:00
  2: 0.003,   // 02:00
  3: 0.002,   // 03:00 - Tiefpunkt
  4: 0.003,   // 04:00
  5: 0.015,   // 05:00 - Frühaufsteher
  6: 0.045,   // 06:00 - Morning Show beginnt
  7: 0.085,   // 07:00 - Peak Pendlerzeit
  8: 0.095,   // 08:00 - Höchste Reichweite
  9: 0.075,   // 09:00 - Arbeitsbeginn
  10: 0.055,  // 10:00
  11: 0.050,  // 11:00
  12: 0.065,  // 12:00 - Mittagspeak
  13: 0.055,  // 13:00
  14: 0.045,  // 14:00
  15: 0.050,  // 15:00
  16: 0.060,  // 16:00 - Nachmittagspeak beginnt
  17: 0.075,  // 17:00 - Feierabend-Peak
  18: 0.070,  // 18:00
  19: 0.055,  // 19:00 - Abendprogramm
  20: 0.040,  // 20:00
  21: 0.030,  // 21:00
  22: 0.020,  // 22:00
  23: 0.012,  // 23:00
};

// Wochentag-Faktoren (Mo=1, So=0)
const WEEKDAY_FACTORS: Record<number, number> = {
  0: 0.70,  // Sonntag - weniger Pendler
  1: 1.00,  // Montag
  2: 1.00,  // Dienstag
  3: 1.00,  // Mittwoch
  4: 1.00,  // Donnerstag
  5: 0.95,  // Freitag - leicht weniger
  6: 0.75,  // Samstag - Wochenende
};

const DAILY_REACH = 50000; // Tagesreichweite

function getSimulatedListenerCount(): number {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const minutes = now.getMinutes();
  
  // Interpoliere zwischen aktueller und nächster Stunde für smoothere Übergänge
  const currentHourFactor = HOURLY_LISTENING_CURVE[hour];
  const nextHourFactor = HOURLY_LISTENING_CURVE[(hour + 1) % 24];
  const interpolatedFactor = currentHourFactor + (nextHourFactor - currentHourFactor) * (minutes / 60);
  
  // Wochentag-Faktor anwenden
  const weekdayFactor = WEEKDAY_FACTORS[dayOfWeek];
  
  // Basisberechnung: Tagesreichweite × Stundenfaktor × Wochentagfaktor
  const baseCount = Math.round(DAILY_REACH * interpolatedFactor * weekdayFactor);
  
  // Natürliche Variation hinzufügen (±8%)
  const variation = 1 + (Math.random() - 0.5) * 0.16;
  
  // Kleine zufällige Schwankungen für "lebendiges" Gefühl
  const microVariation = Math.floor(Math.random() * 50) - 25;
  
  return Math.max(100, Math.round(baseCount * variation) + microVariation);
}

function formatListenerCount(count: number): string {
  if (count >= 1000) {
    const thousands = count / 1000;
    // Zeige eine Dezimalstelle wenn unter 10k
    if (thousands < 10) {
      return `${thousands.toFixed(1).replace('.', ',')}k`;
    }
    return `${Math.round(thousands)}k`;
  }
  return count.toString();
}

export function useLiveListeners(): ListenerPresence & { formattedCount: string } {
  const [count, setCount] = useState(() => getSimulatedListenerCount());
  const [isConnected, setIsConnected] = useState(false);

  // Initiale Verbindung simulieren
  useEffect(() => {
    const connectDelay = setTimeout(() => {
      setIsConnected(true);
      setCount(getSimulatedListenerCount());
    }, 500 + Math.random() * 500);

    return () => clearTimeout(connectDelay);
  }, []);

  // Regelmässige Updates alle 3-8 Sekunden für realistische Schwankungen
  useEffect(() => {
    if (!isConnected) return;

    const updateCount = () => {
      setCount(prevCount => {
        const newCount = getSimulatedListenerCount();
        // Smoothe Übergänge: Bewege uns nur teilweise zum neuen Wert
        const smoothedCount = Math.round(prevCount * 0.7 + newCount * 0.3);
        return smoothedCount;
      });
    };

    // Zufälliges Intervall zwischen 3-8 Sekunden
    const scheduleUpdate = () => {
      const delay = 3000 + Math.random() * 5000;
      return setTimeout(() => {
        updateCount();
        intervalRef = scheduleUpdate();
      }, delay);
    };

    let intervalRef = scheduleUpdate();

    return () => clearTimeout(intervalRef);
  }, [isConnected]);

  return { 
    count, 
    isConnected,
    formattedCount: formatListenerCount(count)
  };
}
