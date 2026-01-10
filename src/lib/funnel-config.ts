// Partner and Campaign configuration for the B2C acquisition funnel

export type HookType = 'coupon' | 'goodie' | 'raffle' | 'streak' | 'none';

export interface PartnerConfig {
  partnerSlug: string;
  partnerName: string;
  partnerId?: string;
  hookType: HookType;
  hookTitle?: string;
  hookDetails?: string;
  validityText?: string;
  rewardCtaText?: string;
  logoUrl?: string;
}

export interface CampaignConfig {
  campaignSlug: string;
  campaignName: string;
  hookType: HookType;
  hookTitle?: string;
  hookDetails?: string;
  validityText?: string;
  rewardCtaText?: string;
  expiresAt?: string;
}

// Mock partner configurations - in production, fetch from database
export const PARTNER_CONFIGS: Record<string, PartnerConfig> = {
  'beispiel-cafe': {
    partnerSlug: 'beispiel-cafe',
    partnerName: 'Beispiel Café',
    hookType: 'coupon',
    hookTitle: '5 CHF Gutschein',
    hookDetails: 'Auf dein nächstes Getränk',
    validityText: 'Gültig bis Ende Monat',
    rewardCtaText: 'Gutschein anzeigen',
  },
  'pizza-marco': {
    partnerSlug: 'pizza-marco',
    partnerName: 'Pizza Marco',
    hookType: 'goodie',
    hookTitle: 'Gratis Dessert',
    hookDetails: 'Bei jeder Bestellung ab 25 CHF',
    validityText: 'Solange Vorrat',
    rewardCtaText: 'Goodie einlösen',
  },
  'fitness-plus': {
    partnerSlug: 'fitness-plus',
    partnerName: 'Fitness Plus',
    hookType: 'raffle',
    hookTitle: '1 Monat Gratis-Abo gewinnen',
    hookDetails: 'Unter allen Teilnehmern',
    validityText: 'Verlosung am 31.01.',
    rewardCtaText: 'Teilnahme ansehen',
  },
  'bäckerei-müller': {
    partnerSlug: 'baeckerei-mueller',
    partnerName: 'Bäckerei Müller',
    hookType: 'streak',
    hookTitle: '3 Besuche = Gratis Gipfeli',
    hookDetails: 'Jeden Besuch scannen',
    validityText: 'Progress: 0/3',
    rewardCtaText: 'Fortschritt ansehen',
  },
  'default': {
    partnerSlug: 'default',
    partnerName: 'Partner',
    hookType: 'none',
  },
};

// Mock campaign configurations
export const CAMPAIGN_CONFIGS: Record<string, CampaignConfig> = {
  'winter-special': {
    campaignSlug: 'winter-special',
    campaignName: 'Winter Special',
    hookType: 'coupon',
    hookTitle: 'Doppelte Taler im Januar',
    hookDetails: 'Bei allen Partnern',
    validityText: 'Nur noch diese Woche',
    rewardCtaText: 'Mitmachen',
  },
  'radio-drop': {
    campaignSlug: 'radio-drop',
    campaignName: 'Radio Drop',
    hookType: 'raffle',
    hookTitle: 'iPhone gewinnen',
    hookDetails: 'Hör Radio & gewinne',
    validityText: 'Endet heute 23:59',
    rewardCtaText: 'Teilnehmen',
  },
};

export function getPartnerConfig(slug: string): PartnerConfig {
  return PARTNER_CONFIGS[slug] || { 
    ...PARTNER_CONFIGS['default'], 
    partnerSlug: slug,
    partnerName: formatPartnerName(slug)
  };
}

export function getCampaignConfig(slug: string): CampaignConfig | null {
  return CAMPAIGN_CONFIGS[slug] || null;
}

function formatPartnerName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// GA4 Event tracking helper
export function trackFunnelEvent(
  eventName: string, 
  params?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', eventName, params);
  }
  // Also log to console in development
  console.log('[Funnel Event]', eventName, params);
}

// Signup bonus amount
export const SIGNUP_BONUS_TALER = 50;

// Drop countdown configuration
export const DROP_CONFIG = {
  defaultDurationMinutes: 60,
  codeWordEnabled: false,
  codeWord: 'RADIO2GO',
};
