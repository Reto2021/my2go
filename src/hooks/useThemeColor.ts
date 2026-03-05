import { useEffect } from 'react';
import { useTimeOfDay } from './useTimeOfDay';

const THEME_COLORS: Record<string, Record<string, string>> = {
  spring: {
    sunrise: '#F5E6D3',
    midday: '#87CEEB',
    goldenhour: '#FFB347',
    night: '#1A2332',
  },
  summer: {
    sunrise: '#FFDAB9',
    midday: '#4FC3F7',
    goldenhour: '#FF8C00',
    night: '#0C3547',
  },
  autumn: {
    sunrise: '#DEB887',
    midday: '#B8860B',
    goldenhour: '#CD853F',
    night: '#1C1C2E',
  },
  winter: {
    sunrise: '#B0C4DE',
    midday: '#E0E8F0',
    goldenhour: '#C0A080',
    night: '#0A1628',
  },
};

export function useThemeColor() {
  const { season, timeOfDay } = useTimeOfDay();

  useEffect(() => {
    const color = THEME_COLORS[season]?.[timeOfDay] || '#0C3547';
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) {
      metaTag.setAttribute('content', color);
    }
  }, [season, timeOfDay]);
}
