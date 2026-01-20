/**
 * Partner Tier Configuration
 * 
 * Defines the features and pricing for each partner tier.
 */

export type PartnerTier = 'starter' | 'partner';

export interface TierFeature {
  name: string;
  starter: boolean | string;
  partner: boolean | string;
  description?: string;
}

export interface TierConfig {
  id: PartnerTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyDiscount: string;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  stripeProductId: string;
  activationFee: number;
  activationFeePriceId: string;
  highlighted?: boolean;
}

// Stripe Product/Price IDs
export const PARTNER_TIERS: Record<PartnerTier, TierConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Kostenlos starten',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: '',
    stripePriceIdMonthly: '',
    stripePriceIdYearly: '',
    stripeProductId: '',
    activationFee: 0,
    activationFeePriceId: '',
  },
  partner: {
    id: 'partner',
    name: 'Partner',
    tagline: 'Volle Power für dein Business',
    monthlyPrice: 249,
    yearlyPrice: 2388, // 199 * 12
    yearlyDiscount: '20%',
    stripePriceIdMonthly: 'price_1So2G5DrdtIKNLRZk2i7nmrU',
    stripePriceIdYearly: 'price_1So2GuDrdtIKNLRZFTgJhKvS', // Yearly price
    stripeProductId: 'prod_TlZOXEOHsPW1q6',
    activationFee: 490,
    activationFeePriceId: 'price_1So2EzDrdtIKNLRZGzPVgX5e',
    highlighted: true,
  },
};

// Feature comparison
export const TIER_FEATURES: TierFeature[] = [
  {
    name: 'Visit-Punkte vergeben',
    starter: true,
    partner: true,
    description: 'Kunden erhalten 5 Taler pro Besuch',
  },
  {
    name: 'Listing in der App',
    starter: true,
    partner: true,
    description: 'Dein Geschäft wird in der App angezeigt',
  },
  {
    name: 'Basis-Analytics',
    starter: true,
    partner: true,
    description: 'Visits und Scans der letzten 7 Tage',
  },
  {
    name: 'Gutscheine & Rewards',
    starter: false,
    partner: true,
    description: 'Erstelle eigene Rabatt-Aktionen',
  },
  {
    name: 'Erweiterte Analytics',
    starter: false,
    partner: true,
    description: 'Detaillierte Statistiken, Export, Trends',
  },
  {
    name: 'Audio-Credits',
    starter: false,
    partner: '20/Monat',
    description: 'Für Radio-Mentions und Kampagnen',
  },
  {
    name: 'Review-Booster',
    starter: false,
    partner: true,
    description: 'Automatische Google-Review Anfragen',
  },
  {
    name: 'Featured-Placement',
    starter: false,
    partner: true,
    description: 'Hervorgehobene Anzeige in der App',
  },
  {
    name: 'POS-Materialien',
    starter: false,
    partner: true,
    description: 'QR-Codes, Aufsteller, Aufkleber',
  },
  {
    name: 'VIP Support',
    starter: false,
    partner: true,
    description: 'Direkter Draht zum Team',
  },
  {
    name: '"Powered by 2Go" Badge',
    starter: 'Sichtbar',
    partner: 'Ausgeblendet',
    description: 'Branding auf deiner Seite',
  },
];

// Check if a feature is available for a tier
export function hasFeature(tier: PartnerTier, featureName: string): boolean {
  const feature = TIER_FEATURES.find(f => f.name === featureName);
  if (!feature) return false;
  
  const value = tier === 'starter' ? feature.starter : feature.partner;
  return value === true || (typeof value === 'string' && value !== 'Sichtbar');
}

// Feature keys for programmatic checks
export const FEATURE_KEYS = {
  REWARDS: 'can_create_rewards',
  ADVANCED_ANALYTICS: 'has_advanced_analytics',
  AUDIO_CREDITS: 'has_audio_credits',
  REVIEW_BOOSTER: 'has_review_booster',
  FEATURED_PLACEMENT: 'has_featured_placement',
  POS_MATERIALS: 'has_pos_materials',
  VIP_SUPPORT: 'has_priority_support',
  HIDE_BADGE: 'can_hide_badge',
  EXPORT_DATA: 'can_export_data',
} as const;

// Check feature access by key
export function canAccess(tier: PartnerTier, featureKey: keyof typeof FEATURE_KEYS): boolean {
  if (tier === 'partner') return true;
  
  // Starter tier only has basic features
  const starterFeatures = ['VISIT_POINTS', 'BASIC_LISTING', 'BASIC_ANALYTICS'];
  return starterFeatures.includes(featureKey);
}
