// My 2Go Partner Pricing Configuration
// All prices in CHF - NETTO (exkl. MwSt)
// MwSt Rate: 8.1% (Switzerland)

export const MWST_RATE = 0.081;

export type PlanId = 'starter' | 'growth' | 'radio';
export type BillingInterval = 'monthly' | 'yearly';
export type PosKitId = 'basic' | 'pro' | 'premium';

export const calculateMwSt = (netAmount: number) => Math.round(netAmount * MWST_RATE * 100) / 100;
export const calculateBrutto = (netAmount: number) => netAmount + calculateMwSt(netAmount);
export interface PlanDetails {
  id: PlanId;
  name: string;
  tagline: string;
  isRecommended?: boolean;
  activationFee: number;
  activationPriceId: string;
  monthlyPrice: number;
  monthlyPriceId: string;
  yearlyPrice: number;
  yearlyPriceId: string;
  audioCredits: number;
  features: string[];
  highlight?: string;
}

export interface PosKit {
  id: PosKitId;
  name: string;
  price: number;
  priceId: string;
  description: string;
  items: string[];
}

export const PLANS: Record<PlanId, PlanDetails> = {
  starter: {
    id: 'starter',
    name: 'My 2Go Starter',
    tagline: 'Perfekt für den Einstieg',
    activationFee: 690,
    activationPriceId: 'price_1So2FoDrdtIKNLRZ11aWrivb',
    monthlyPrice: 249,
    monthlyPriceId: 'price_1So2G5DrdtIKNLRZk2i7nmrU',
    yearlyPrice: 2490,
    yearlyPriceId: 'price_1So2GMDrdtIKNLRZyIszAqLA',
    audioCredits: 20,
    features: [
      'Loyalty Basis (2Go Taler)',
      'Review-Booster',
      '1 Kampagne/Monat',
      'Dashboard Basic',
      '20 Audio-Credits/Monat'
    ]
  },
  growth: {
    id: 'growth',
    name: 'My 2Go Growth',
    tagline: 'Für wachsende Betriebe',
    isRecommended: true,
    activationFee: 1490,
    activationPriceId: 'price_1So2GXDrdtIKNLRZxdxhbOFB',
    monthlyPrice: 499,
    monthlyPriceId: 'price_1So2GhDrdtIKNLRZI2UYGrYd',
    yearlyPrice: 4990,
    yearlyPriceId: 'price_1So2GsDrdtIKNLRZ8UbJ2zns',
    audioCredits: 60,
    highlight: 'Empfohlen',
    features: [
      'Alles aus Starter',
      '2-3 Kampagnen/Monat',
      'Segmentierung',
      'Referral-Programm',
      'Monatsreport + 30-min Call',
      '60 Audio-Credits/Monat'
    ]
  },
  radio: {
    id: 'radio',
    name: 'My 2Go Radio Partner',
    tagline: 'Maximale Reichweite',
    activationFee: 2990,
    activationPriceId: 'price_1So2H3DrdtIKNLRZOrON0l63',
    monthlyPrice: 990,
    monthlyPriceId: 'price_1So2HEDrdtIKNLRZgZ28SNPD',
    yearlyPrice: 9900,
    yearlyPriceId: 'price_1So2HNDrdtIKNLRZ6Mm79hwb',
    audioCredits: 140,
    features: [
      'Alles aus Growth',
      'Netzwerkaktionen',
      'VIP Support',
      'Stärkere Präsenz im Radio',
      'Priorisierte Kampagnen',
      '140 Audio-Credits/Monat'
    ]
  }
};

export const POS_KITS: Record<PosKitId, PosKit> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 290,
    priceId: 'price_1So2HcDrdtIKNLRZtRYJRAoV',
    description: 'Für den einfachen Start',
    items: [
      'Tischaufsteller mit QR-Code',
      'Aufkleber-Set (10 Stück)'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 590,
    priceId: 'price_1So2HhDrdtIKNLRZ3ILgc5I9',
    description: 'Für mehr Sichtbarkeit',
    items: [
      'Premium Tischaufsteller',
      'NFC-Tag für kontaktloses Scannen',
      'Aufkleber-Set (20 Stück)',
      'Tischkarten (5 Stück)'
    ]
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 990,
    priceId: 'price_1So2HlDrdtIKNLRZUiIPFZxw',
    description: 'Das Komplettpaket',
    items: [
      'Deluxe Display-Set',
      'NFC-Tags Set (3 Stück)',
      'Aufkleber-Set (30 Stück)',
      'Tischkarten (10 Stück)',
      'Fensterfolie'
    ]
  }
};

export const GUARANTEE_CONDITIONS = [
  'Onboarding innerhalb 5 Tagen abgeschlossen',
  'QR/POS mindestens 10 Öffnungstage sichtbar im Einsatz',
  'Mindestens 1 Kampagne ausgespielt',
  'Antrag bis spätestens Tag 30 eingereicht'
];

// Audio Credit costs
export const AUDIO_CREDIT_COSTS = {
  air_drop: 1,  // 5-8 seconds sponsor tag
  radio_spot: 3, // 20 second full spot
} as const;

// Non-Profit discount code
export const NONPROFIT_COUPON_CODE = 'NONPROFIT50';

export const formatCHF = (amount: number) => {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatCHFWithDecimals = (amount: number) => {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
