/**
 * useTimeOfDay – Automatische Tageszeit- und Jahreszeit-Erkennung
 * Steuert die dynamische Hero-Grafik: 4 Jahreszeiten × 4 Tageszeiten = 16 Stimmungen
 */
import { useEffect, useState, useMemo } from "react";

export type TimeOfDay = "sunrise" | "midday" | "goldenhour" | "night";
export type Season = "spring" | "summer" | "autumn" | "winter";

interface TimeOfDayConfig {
  timeOfDay: TimeOfDay;
  season: Season;
  label: string;
  seasonLabel: string;
  greeting: string;
  claim: string;
  imageDesktop: string;
  textColor: "light" | "dark";
}

const TIME_LABELS: Record<TimeOfDay, { label: string; greeting: string; claim: string }> = {
  sunrise: {
    label: "Morgen",
    greeting: "Guten Morgen",
    claim: "Starte deinen Tag.",
  },
  midday: {
    label: "Mittag",
    greeting: "Schönen Tag",
    claim: "Geniess die Mittagspause.",
  },
  goldenhour: {
    label: "Abend",
    greeting: "Guten Abend",
    claim: "Feierabend. Belohn dich.",
  },
  night: {
    label: "Nacht",
    greeting: "Gute Nacht",
    claim: "Schlaf gut. Morgen geht's weiter.",
  },
};

const SEASON_LABELS: Record<Season, string> = {
  spring: "Frühling",
  summer: "Sommer",
  autumn: "Herbst",
  winter: "Winter",
};

// Text color: dark for bright backgrounds, light for dark backgrounds
const TEXT_COLORS: Record<Season, Record<TimeOfDay, "light" | "dark">> = {
  spring: { sunrise: "dark", midday: "dark", goldenhour: "light", night: "light" },
  summer: { sunrise: "dark", midday: "dark", goldenhour: "light", night: "light" },
  autumn: { sunrise: "dark", midday: "dark", goldenhour: "light", night: "light" },
  winter: { sunrise: "dark", midday: "dark", goldenhour: "light", night: "light" },
};

// CDN URLs for all 16 season × time combinations
const IMAGES: Record<Season, Record<TimeOfDay, string>> = {
  spring: {
    sunrise: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-spring-sunrise-desktop-i6VR723eDpJZukzVvMQdDj.webp",
    midday: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-spring-midday-desktop-bP9dTXck3zwB7wBeHqv82i.webp",
    goldenhour: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-spring-goldenhour-desktop-RkwAf2nUDEE9wAzHfux8KK.webp",
    night: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-spring-night-desktop-JQTAm5Tnu7Wq4g2fdnMowR.webp",
  },
  summer: {
    sunrise: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-sunrise-clean-desktop-HXzKvYaYCxwxqKnhxUXCJj.webp",
    midday: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-midday-desktop-M5dZF4EqtSDtZYnDDUqJNm.webp",
    goldenhour: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-goldenhour-desktop-EUwdzd3sYUbxwmeNjby2L7.webp",
    night: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-night-desktop-KWs5QsFD2W873oZTrSQsDn.webp",
  },
  autumn: {
    sunrise: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-autumn-sunrise-desktop-b7KFYy6fak9SAQj3uU9Xeh.webp",
    midday: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-autumn-midday-desktop-VPpThewXYwVBVBmirX96QH.webp",
    goldenhour: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-autumn-goldenhour-desktop-3pDPw7uF86gwcZBvUXq8uv.webp",
    night: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-autumn-night-desktop-Bke2yUN2RSv7AduXDCRRwh.webp",
  },
  winter: {
    sunrise: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-winter-sunrise-desktop-TNVicBCHw3r8yhJfZnRrab.webp",
    midday: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-winter-midday-desktop-S6Z2SJmGcMUSbKr4A7ZYJZ.webp",
    goldenhour: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-winter-goldenhour-desktop-3KodHURvBA45fMAeusNugR.webp",
    night: "https://d2xsxph8kpxj0f.cloudfront.net/310519663312258864/GUGgaf2V5pAtAv8xkVuAjV/hero-winter-night-desktop-Cwywa8oYsnUsu8wJHhqMcZ.webp",
  },
};

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 11) return "sunrise";
  if (hour >= 11 && hour < 17) return "midday";
  if (hour >= 17 && hour < 21) return "goldenhour";
  return "night";
}

function getSeason(month: number): Season {
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

export function useTimeOfDay(): TimeOfDayConfig {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() =>
    getTimeOfDay(new Date().getHours())
  );
  const [season, setSeason] = useState<Season>(() =>
    getSeason(new Date().getMonth())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newTimeOfDay = getTimeOfDay(now.getHours());
      const newSeason = getSeason(now.getMonth());
      if (newTimeOfDay !== timeOfDay) setTimeOfDay(newTimeOfDay);
      if (newSeason !== season) setSeason(newSeason);
    }, 60_000);
    return () => clearInterval(interval);
  }, [timeOfDay, season]);

  const config = useMemo(() => ({
    timeOfDay,
    season,
    seasonLabel: SEASON_LABELS[season],
    ...TIME_LABELS[timeOfDay],
    imageDesktop: IMAGES[season][timeOfDay],
    textColor: TEXT_COLORS[season][timeOfDay],
  }), [timeOfDay, season]);

  return config;
}

// Exports for external use
export const ALL_IMAGES = IMAGES;
export const ALL_SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];
export const ALL_TIMES: TimeOfDay[] = ["sunrise", "midday", "goldenhour", "night"];
export { SEASON_LABELS, TIME_LABELS };
