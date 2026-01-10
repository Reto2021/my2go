/**
 * 2Go Taler Hub - Gateway API Client
 * 
 * This file implements the Gateway API contract that connects to:
 * - Boomerangme (loyalty backend: points, rewards, redemptions)
 * - GoHighLevel (CRM: partners, communications)
 * 
 * ARCHITECTURE:
 * Frontend (Lovable) → Gateway API → Boomerangme/GHL
 * 
 * Currently using MOCK implementation.
 * Replace BASE_URL with real gateway endpoint when ready.
 * 
 * Boomerangme API Reference: https://docs.boomerangme.cards/api/api-docs
 * Card Types: Stamp(0), Cashback(1), Multipass(2), Coupon(3), 
 *             Discount(4), Gift(5), Membership(6), Reward(7)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE = '/api'; // Will be replaced with real gateway URL
const USE_MOCK = true;   // Set to false when gateway is ready

// ============================================================================
// TYPE DEFINITIONS (matching Gateway API Contract)
// ============================================================================

// Session & Auth (Cookie-based)
export interface SessionResponse {
  hasSession: boolean;
  memberId?: string;
  displayName?: string;
  balance?: number;
  pendingBalance?: number;
  lifetimeBalance?: number;
  tier?: string;
  passLink?: string;
}

export interface SessionStartRequest {
  token: string; // URL token to exchange for cookie session
}

export interface SessionStartResponse {
  success: boolean;
  message?: string;
}

export interface MemberProfile {
  memberId: string;
  firstName?: string;
  balance: number;
  tier?: string;
  passLink?: string;
}

// Rewards
export interface RewardListItem {
  id: string;
  title: string;
  partnerName: string;
  category: 'experience' | 'discount' | 'product' | 'exclusive';
  cost: number;
  summary: string;
  badges: string[];
  imageUrl?: string;
  distanceKm?: number;
}

export interface RewardDetail {
  id: string;
  title: string;
  description: string;
  terms: string[];
  cost: number;
  partner: {
    id: string;
    name: string;
    address: string;
    openingHours?: string;
  };
  limits?: {
    perDay?: number;
    perUser?: number;
  };
  validUntil?: string;
}

export interface RewardRedemptionResult {
  redemptionId: string;
  redemptionCode: string;
  qrPayload: string;
  expiresAt: string;
  newBalance?: number;
}

export interface RedemptionStatus {
  status: 'created' | 'used' | 'expired' | 'cancelled';
  usedAt?: string;
  partnerName?: string;
  cost: number;
  balanceAfter?: number;
}

// Codes
export interface CodeRedeemRequest {
  code: string;
}

export interface CodeRedeemResponse {
  status: 'ok' | 'invalid' | 'expired' | 'used' | 'rate_limited';
  pointsAwarded?: number;
  newBalance?: number;
  message: string;
}

// Partners
export interface PartnerListItem {
  id: string;
  name: string;
  category: string;
  city: string;
  openNow?: boolean;
  distanceKm?: number;
  hasRewards: boolean;
}

export interface PartnerDetail {
  id: string;
  name: string;
  category: string;
  address: string;
  openingHours?: string;
  phone?: string;
  website?: string;
  mapLink?: string;
}

export interface PartnerRewardItem {
  id: string;
  title: string;
  cost: number;
  summary: string;
}

// FAQ
export interface FAQItem {
  q: string;
  a: string;
  category: string;
}

// Support
export interface SupportTicketRequest {
  topic: string;
  message: string;
  emailOrPhone?: string;
}

export interface SupportTicketResponse {
  ticketId: string;
  status: string;
}

// Legacy compatibility types
export interface TalerBalance {
  current: number;
  pending: number;
  lifetime: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: 'experience' | 'discount' | 'product' | 'exclusive';
  partnerId: string;
  partnerName: string;
  imageUrl?: string;
  available: boolean;
  expiresAt?: string;
  distanceKm?: number; // Distance from user in km
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  city?: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  rewardCount: number;
}

export interface Session {
  valid: boolean;
  userId?: string;
  displayName?: string;
}

export interface RedemptionResult {
  success: boolean;
  message: string;
  newBalance?: number;
  redemptionCode?: string;
}

export interface CodeRedeemResult {
  success: boolean;
  message: string;
  pointsEarned?: number;
  newBalance?: number;
}

// ============================================================================
// MOCK DATA (Boomerangme-style)
// Regions: Aargau (Brugg, Windisch, Aarau, Baden) + Liechtenstein (Vaduz, Schaan, Balzers)
// ============================================================================

const MOCK_REWARDS: RewardListItem[] = [
  // Original rewards
  {
    id: 'r1',
    title: 'Kaffee-Upgrade',
    partnerName: 'Café Sonnenschein',
    category: 'discount',
    cost: 50,
    summary: 'Gratis Upgrade auf die nächste Grösse',
    badges: ['Beliebt'],
  },
  {
    id: 'r2',
    title: 'Gratis Dessert',
    partnerName: 'Restaurant Seeblick',
    category: 'product',
    cost: 100,
    summary: 'Ein Dessert deiner Wahl kostenlos',
    badges: ['Neu'],
  },
  {
    id: 'r3',
    title: '2-für-1 Museum',
    partnerName: 'Aargauer Kunsthaus',
    category: 'discount',
    cost: 75,
    summary: 'Zweite Person gratis ins Kunstmuseum',
    badges: ['Kultur'],
  },
  {
    id: 'r4',
    title: 'Studio-Besuch',
    partnerName: 'Radio 2Go',
    category: 'exclusive',
    cost: 200,
    summary: 'Exklusiver Blick hinter die Kulissen',
    badges: ['Exklusiv', 'Radio 2Go'],
  },
  {
    id: 'r5',
    title: 'Song-Wunsch-Tag',
    partnerName: 'Radio 2Go',
    category: 'experience',
    cost: 150,
    summary: 'Wähle einen Song für die Sendung',
    badges: ['Radio 2Go'],
  },
  {
    id: 'r6',
    title: 'Probetraining',
    partnerName: 'CrossFit Brugg',
    category: 'experience',
    cost: 80,
    summary: 'Gratis Probetraining im Fitnessstudio',
    badges: ['Sport'],
  },
  {
    id: 'r7',
    title: 'Geburtstagswunsch on Air',
    partnerName: 'Radio 2Go',
    category: 'exclusive',
    cost: 100,
    summary: 'Dein Gruss wird live gesendet',
    badges: ['Radio 2Go', 'Beliebt'],
  },
  {
    id: 'r8',
    title: 'Kinder-Menü gratis',
    partnerName: 'Restaurant Seeblick',
    category: 'product',
    cost: 60,
    summary: 'Ein Kinder-Menü kostenlos',
    badges: ['Familie'],
  },
  // New Aargau rewards
  {
    id: 'r9',
    title: 'Schloss-Führung',
    partnerName: 'Schloss Habsburg',
    category: 'experience',
    cost: 120,
    summary: 'Private Führung durch das historische Schloss',
    badges: ['Kultur', 'Exklusiv'],
  },
  {
    id: 'r10',
    title: 'Wellness-Eintritt',
    partnerName: 'Thermalbad Zurzach',
    category: 'discount',
    cost: 90,
    summary: '50% Rabatt auf den Tageseintritt',
    badges: ['Wellness', 'Beliebt'],
  },
  {
    id: 'r11',
    title: 'Brunch für 2',
    partnerName: 'Café Badener',
    category: 'product',
    cost: 180,
    summary: 'Sonntagsbrunch für zwei Personen',
    badges: ['Gastronomie'],
  },
  {
    id: 'r12',
    title: 'Kinoticket',
    partnerName: 'Kino Sterk Windisch',
    category: 'product',
    cost: 40,
    summary: 'Gratis Kinoticket für einen Film',
    badges: ['Neu'],
  },
  {
    id: 'r13',
    title: 'Weinprobe',
    partnerName: 'Weingut Fürst',
    category: 'experience',
    cost: 130,
    summary: 'Geführte Degustation mit 5 Weinen',
    badges: ['Genuss'],
  },
  // Liechtenstein rewards
  {
    id: 'r14',
    title: 'Kunstmuseum Vaduz',
    partnerName: 'Kunstmuseum Liechtenstein',
    category: 'discount',
    cost: 65,
    summary: '2-für-1 Eintritt ins Museum',
    badges: ['Kultur'],
  },
  {
    id: 'r15',
    title: 'Bergbahn-Ticket',
    partnerName: 'Malbun Bergbahnen',
    category: 'product',
    cost: 110,
    summary: 'Gratis Tageskarte für die Bergbahn',
    badges: ['Outdoor', 'Beliebt'],
  },
  {
    id: 'r16',
    title: 'Alpenkräuter-Workshop',
    partnerName: 'Kräutergarten Balzers',
    category: 'experience',
    cost: 95,
    summary: 'Lerne über lokale Heilkräuter',
    badges: ['Natur', 'Neu'],
  },
  {
    id: 'r17',
    title: 'Fürstlicher Käse',
    partnerName: 'Liechtensteiner Käserei',
    category: 'product',
    cost: 55,
    summary: 'Käseplatte zum Mitnehmen',
    badges: ['Genuss'],
  },
];

const MOCK_REWARD_DETAILS: Record<string, RewardDetail> = {
  r1: {
    id: 'r1',
    title: 'Kaffee-Upgrade',
    description: 'Erhalte ein kostenloses Upgrade auf die nächste Grösse bei jedem Kaffee. Gilt für alle Heissgetränke auf der Karte.',
    terms: ['Gültig für 1 Getränk pro Einlösung', 'Nicht kombinierbar mit anderen Aktionen', 'Zeige den Code an der Kasse'],
    cost: 50,
    partner: { id: 'p1', name: 'Café Sonnenschein', address: 'Bahnhofstrasse 8, 5200 Brugg', openingHours: 'Mo-Fr 7:00-18:00, Sa 8:00-16:00' },
    limits: { perDay: 1, perUser: 5 },
    validUntil: '2026-12-31',
  },
  r2: {
    id: 'r2',
    title: 'Gratis Dessert',
    description: 'Geniesse ein Dessert deiner Wahl kostenlos zu deiner Bestellung.',
    terms: ['Mindestbestellwert CHF 25', 'Dessert nach Verfügbarkeit', 'Nicht für Take-away'],
    cost: 100,
    partner: { id: 'p2', name: 'Restaurant Seeblick', address: 'Seeweg 45, 5430 Wettingen', openingHours: 'Di-So 11:30-22:00' },
    limits: { perUser: 3 },
  },
  r3: {
    id: 'r3',
    title: '2-für-1 Museum',
    description: 'Besuche das Aargauer Kunsthaus zu zweit – die zweite Person kommt gratis rein!',
    terms: ['Gültig für regulären Eintritt', 'Nicht für Sonderausstellungen', 'Vorlage an der Kasse'],
    cost: 75,
    partner: { id: 'p3', name: 'Aargauer Kunsthaus', address: 'Aargauerplatz, 5001 Aarau', openingHours: 'Di-So 10:00-17:00' },
  },
  r4: {
    id: 'r4',
    title: 'Studio-Besuch',
    description: 'Erlebe Radio 2Go hautnah! Besuche unser Studio während einer Live-Sendung.',
    terms: ['Nach Terminvereinbarung', 'Max. 2 Personen', 'Dauer ca. 45 Minuten'],
    cost: 200,
    partner: { id: 'radio2go', name: 'Radio 2Go', address: 'Radiostrasse 1, 5200 Brugg', openingHours: 'Termine nach Absprache' },
    limits: { perUser: 1 },
  },
  r5: {
    id: 'r5',
    title: 'Song-Wunsch-Tag',
    description: 'Wähle deinen Lieblingssong und wir spielen ihn live auf Radio 2Go.',
    terms: ['Song muss lizenziert sein', 'Ausstrahlung innerhalb von 7 Tagen', 'Persönliche Widmung möglich'],
    cost: 150,
    partner: { id: 'radio2go', name: 'Radio 2Go', address: 'Radiostrasse 1, 5200 Brugg' },
  },
  r6: {
    id: 'r6',
    title: 'Probetraining',
    description: 'Teste CrossFit Brugg mit einem kostenlosen Probetraining inkl. Einführung.',
    terms: ['Einmalig pro Person', 'Termin nach Verfügbarkeit', 'Sportkleider mitbringen'],
    cost: 80,
    partner: { id: 'p4', name: 'CrossFit Brugg', address: 'Industriestrasse 12, 5200 Brugg', openingHours: 'Mo-Fr 6:00-21:00, Sa 8:00-14:00' },
    limits: { perUser: 1 },
  },
  r7: {
    id: 'r7',
    title: 'Geburtstagswunsch on Air',
    description: 'Lass deinen persönlichen Geburtstagsgruss live auf Radio 2Go senden.',
    terms: ['Text max. 50 Wörter', 'Ausstrahlung am Geburtstag oder +/- 1 Tag', '3 Tage im Voraus anmelden'],
    cost: 100,
    partner: { id: 'radio2go', name: 'Radio 2Go', address: 'Radiostrasse 1, 5200 Brugg' },
  },
  r8: {
    id: 'r8',
    title: 'Kinder-Menü gratis',
    description: 'Ein Kinder-Menü kostenlos zu jedem Erwachsenen-Hauptgericht.',
    terms: ['1 Kinder-Menü pro Erwachsenen-Menü', 'Nur vor Ort', 'Getränke nicht inbegriffen'],
    cost: 60,
    partner: { id: 'p2', name: 'Restaurant Seeblick', address: 'Seeweg 45, 5430 Wettingen', openingHours: 'Di-So 11:30-22:00' },
  },
  r9: {
    id: 'r9',
    title: 'Schloss-Führung',
    description: 'Erlebe eine exklusive Führung durch das historische Schloss Habsburg.',
    terms: ['Termin nach Vereinbarung', 'Max. 4 Personen', 'Dauer ca. 90 Minuten'],
    cost: 120,
    partner: { id: 'p5', name: 'Schloss Habsburg', address: 'Habsburg 1, 5245 Habsburg', openingHours: 'Di-So 10:00-17:00' },
    limits: { perUser: 1 },
  },
  r10: {
    id: 'r10',
    title: 'Wellness-Eintritt',
    description: '50% Rabatt auf den Tageseintritt ins Thermalbad Zurzach.',
    terms: ['Gültig Mo-Fr', 'Nicht an Feiertagen', 'Badekleidung mitbringen'],
    cost: 90,
    partner: { id: 'p6', name: 'Thermalbad Zurzach', address: 'Dr. Martin-Erb-Strasse 5, 5330 Bad Zurzach', openingHours: 'Täglich 9:00-22:00' },
    limits: { perDay: 2 },
  },
  r11: {
    id: 'r11',
    title: 'Brunch für 2',
    description: 'Geniesse einen reichhaltigen Sonntagsbrunch für zwei Personen.',
    terms: ['Nur sonntags', 'Reservation empfohlen', 'Inkl. Getränk'],
    cost: 180,
    partner: { id: 'p7', name: 'Café Badener', address: 'Badstrasse 20, 5400 Baden', openingHours: 'Mi-So 8:00-18:00' },
  },
  r12: {
    id: 'r12',
    title: 'Kinoticket',
    description: 'Gratis Kinoticket für einen Film deiner Wahl im Kino Sterk.',
    terms: ['Nicht für Premieren', 'Gültig Mo-Do', 'Vorlage an der Kasse'],
    cost: 40,
    partner: { id: 'p8', name: 'Kino Sterk Windisch', address: 'Bahnhofstrasse 1, 5210 Windisch', openingHours: 'Täglich ab 14:00' },
  },
  r13: {
    id: 'r13',
    title: 'Weinprobe',
    description: 'Geführte Degustation mit 5 ausgewählten Weinen aus der Region.',
    terms: ['Ab 18 Jahren', 'Dauer ca. 60 Minuten', 'Max. 2 Personen'],
    cost: 130,
    partner: { id: 'p9', name: 'Weingut Fürst', address: 'Rebgasse 3, 5316 Leuggern', openingHours: 'Fr-So 14:00-18:00' },
    limits: { perUser: 2 },
  },
  r14: {
    id: 'r14',
    title: 'Kunstmuseum Vaduz',
    description: '2-für-1 Eintritt ins Kunstmuseum Liechtenstein.',
    terms: ['Gültig für Dauerausstellung', 'Vorlage an der Kasse'],
    cost: 65,
    partner: { id: 'p10', name: 'Kunstmuseum Liechtenstein', address: 'Städtle 32, 9490 Vaduz', openingHours: 'Di-So 10:00-17:00' },
  },
  r15: {
    id: 'r15',
    title: 'Bergbahn-Ticket',
    description: 'Gratis Tageskarte für die Bergbahnen in Malbun.',
    terms: ['Gültig im Sommer und Winter', 'Nicht übertragbar'],
    cost: 110,
    partner: { id: 'p11', name: 'Malbun Bergbahnen', address: 'Malbun 35, 9497 Triesenberg', openingHours: 'Saisonabhängig' },
    limits: { perDay: 1 },
  },
  r16: {
    id: 'r16',
    title: 'Alpenkräuter-Workshop',
    description: 'Lerne über lokale Heilkräuter und ihre Anwendung.',
    terms: ['Anmeldung erforderlich', 'Dauer ca. 2 Stunden', 'Inkl. Kräutertee'],
    cost: 95,
    partner: { id: 'p12', name: 'Kräutergarten Balzers', address: 'Gartenweg 5, 9496 Balzers', openingHours: 'Apr-Okt, Di-Sa 10:00-17:00' },
  },
  r17: {
    id: 'r17',
    title: 'Fürstlicher Käse',
    description: 'Käseplatte mit Spezialitäten aus Liechtenstein zum Mitnehmen.',
    terms: ['Abholung vor Ort', 'Vorbestellung 1 Tag vorher', 'Ca. 500g'],
    cost: 55,
    partner: { id: 'p13', name: 'Liechtensteiner Käserei', address: 'Schaanerstrasse 15, 9494 Schaan', openingHours: 'Mo-Fr 8:00-18:00, Sa 8:00-12:00' },
  },
};

const MOCK_PARTNERS: PartnerListItem[] = [
  // Aargau - Brugg
  { id: 'p1', name: 'Café Sonnenschein', category: 'Gastronomie', city: 'Brugg', openNow: true, hasRewards: true },
  { id: 'p4', name: 'CrossFit Brugg', category: 'Sport & Fitness', city: 'Brugg', openNow: true, hasRewards: true },
  { id: 'radio2go', name: 'Radio 2Go', category: 'Erlebnis', city: 'Brugg', openNow: true, hasRewards: true },
  // Aargau - Windisch
  { id: 'p8', name: 'Kino Sterk Windisch', category: 'Unterhaltung', city: 'Windisch', openNow: true, hasRewards: true },
  // Aargau - Aarau
  { id: 'p3', name: 'Aargauer Kunsthaus', category: 'Kultur', city: 'Aarau', openNow: false, hasRewards: true },
  // Aargau - Baden
  { id: 'p7', name: 'Café Badener', category: 'Gastronomie', city: 'Baden', openNow: true, hasRewards: true },
  // Aargau - Wettingen
  { id: 'p2', name: 'Restaurant Seeblick', category: 'Gastronomie', city: 'Wettingen', openNow: true, hasRewards: true },
  // Aargau - Other
  { id: 'p5', name: 'Schloss Habsburg', category: 'Kultur', city: 'Habsburg', openNow: true, hasRewards: true },
  { id: 'p6', name: 'Thermalbad Zurzach', category: 'Wellness', city: 'Bad Zurzach', openNow: true, hasRewards: true },
  { id: 'p9', name: 'Weingut Fürst', category: 'Genuss', city: 'Leuggern', openNow: false, hasRewards: true },
  // Liechtenstein - Vaduz
  { id: 'p10', name: 'Kunstmuseum Liechtenstein', category: 'Kultur', city: 'Vaduz', openNow: true, hasRewards: true },
  // Liechtenstein - Schaan
  { id: 'p13', name: 'Liechtensteiner Käserei', category: 'Genuss', city: 'Schaan', openNow: true, hasRewards: true },
  // Liechtenstein - Balzers
  { id: 'p12', name: 'Kräutergarten Balzers', category: 'Natur', city: 'Balzers', openNow: false, hasRewards: true },
  // Liechtenstein - Triesenberg/Malbun
  { id: 'p11', name: 'Malbun Bergbahnen', category: 'Outdoor', city: 'Malbun', openNow: true, hasRewards: true },
];

const MOCK_PARTNER_DETAILS: Record<string, PartnerDetail> = {
  p1: { id: 'p1', name: 'Café Sonnenschein', category: 'Gastronomie', address: 'Bahnhofstrasse 8, 5200 Brugg', openingHours: 'Mo-Fr 7:00-18:00, Sa 8:00-16:00', phone: '+41 56 123 45 67' },
  p2: { id: 'p2', name: 'Restaurant Seeblick', category: 'Gastronomie', address: 'Seeweg 45, 5430 Wettingen', openingHours: 'Di-So 11:30-22:00', phone: '+41 56 987 65 43', website: 'https://seeblick-wettingen.ch' },
  p3: { id: 'p3', name: 'Aargauer Kunsthaus', category: 'Kultur', address: 'Aargauerplatz, 5001 Aarau', openingHours: 'Di-So 10:00-17:00', website: 'https://aargauerkunsthaus.ch' },
  p4: { id: 'p4', name: 'CrossFit Brugg', category: 'Sport & Fitness', address: 'Industriestrasse 12, 5200 Brugg', openingHours: 'Mo-Fr 6:00-21:00, Sa 8:00-14:00', phone: '+41 56 555 44 33' },
  p5: { id: 'p5', name: 'Schloss Habsburg', category: 'Kultur', address: 'Habsburg 1, 5245 Habsburg', openingHours: 'Di-So 10:00-17:00', website: 'https://schlosshabsburg.ch' },
  p6: { id: 'p6', name: 'Thermalbad Zurzach', category: 'Wellness', address: 'Dr. Martin-Erb-Strasse 5, 5330 Bad Zurzach', openingHours: 'Täglich 9:00-22:00', website: 'https://thermalbad.ch', phone: '+41 56 269 00 00' },
  p7: { id: 'p7', name: 'Café Badener', category: 'Gastronomie', address: 'Badstrasse 20, 5400 Baden', openingHours: 'Mi-So 8:00-18:00', phone: '+41 56 222 33 44' },
  p8: { id: 'p8', name: 'Kino Sterk Windisch', category: 'Unterhaltung', address: 'Bahnhofstrasse 1, 5210 Windisch', openingHours: 'Täglich ab 14:00', website: 'https://kinosterk.ch' },
  p9: { id: 'p9', name: 'Weingut Fürst', category: 'Genuss', address: 'Rebgasse 3, 5316 Leuggern', openingHours: 'Fr-So 14:00-18:00', phone: '+41 56 245 12 34' },
  p10: { id: 'p10', name: 'Kunstmuseum Liechtenstein', category: 'Kultur', address: 'Städtle 32, 9490 Vaduz', openingHours: 'Di-So 10:00-17:00', website: 'https://kunstmuseum.li' },
  p11: { id: 'p11', name: 'Malbun Bergbahnen', category: 'Outdoor', address: 'Malbun 35, 9497 Triesenberg', openingHours: 'Saisonabhängig', website: 'https://malbun.li' },
  p12: { id: 'p12', name: 'Kräutergarten Balzers', category: 'Natur', address: 'Gartenweg 5, 9496 Balzers', openingHours: 'Apr-Okt, Di-Sa 10:00-17:00', phone: '+423 384 12 34' },
  p13: { id: 'p13', name: 'Liechtensteiner Käserei', category: 'Genuss', address: 'Schaanerstrasse 15, 9494 Schaan', openingHours: 'Mo-Fr 8:00-18:00, Sa 8:00-12:00', phone: '+423 232 45 67' },
  radio2go: { id: 'radio2go', name: 'Radio 2Go', category: 'Erlebnis', address: 'Radiostrasse 1, 5200 Brugg', website: 'https://radio2go.fm', mapLink: 'https://maps.google.com/?q=Radio+2Go+Brugg' },
};

const MOCK_FAQ: FAQItem[] = [
  // Grundlagen (3)
  { q: 'Was sind 2Go Taler?', a: 'Bonuspunkte von Radio 2Go. Sammeln bei Partnern, einlösen für Rewards. Nicht auszahlbar.', category: 'Grundlagen' },
  { q: 'Wie sammle ich Taler?', a: 'Karte beim Partner vorzeigen oder On-Air Codes aus dem Radio eingeben.', category: 'Grundlagen' },
  { q: 'Wo ist meine Karte?', a: 'Du erhältst einen Link per E-Mail oder Wallet. Damit öffnest du deine Karte.', category: 'Grundlagen' },
  
  // Gutscheine (4)
  { q: 'Wie löse ich einen Gutschein ein?', a: 'Gutschein wählen, einlösen, Code beim Partner vorzeigen. Nur vor Ort gültig.', category: 'Gutscheine' },
  { q: 'Wie lange ist der Einlösecode gültig?', a: '10 Minuten. Danach verfällt er, deine Taler bleiben erhalten.', category: 'Gutscheine' },
  { q: 'Kann ich Gutscheine zurückgeben?', a: 'Nein. Einmal eingelöst, kein Rücktausch möglich.', category: 'Gutscheine' },
  { q: 'Gibt es ein Limit pro Tag?', a: 'Ja, manche Gutscheine haben ein Tageslimit. Steht beim jeweiligen Gutschein.', category: 'Gutscheine' },
  
  // Codes (3)
  { q: 'Was ist ein On-Air Code?', a: 'Codes, die live im Radio genannt werden. Eingeben und Taler kassieren!', category: 'Codes' },
  { q: 'Mein Code funktioniert nicht?', a: 'Schreibweise prüfen. Codes sind 24h gültig und nur 1x einlösbar.', category: 'Codes' },
  { q: 'Wie viele Codes kann ich pro Tag einlösen?', a: 'Max. 5 Codes pro Tag. Bei Missbrauch wird das Konto gesperrt.', category: 'Codes' },
  
  // Taler & Gültigkeit (3)
  { q: 'Verfallen meine Taler?', a: 'Nach 24 Monaten Inaktivität. Regelmässig nutzen hält sie aktiv.', category: 'Taler' },
  { q: 'Kann ich Taler auszahlen?', a: 'Nein. 2Go Taler sind Bonuspunkte, keine Währung. Keine Barauszahlung.', category: 'Taler' },
  { q: 'Kann ich Taler übertragen?', a: 'Nein. Taler sind an dein Konto gebunden und nicht übertragbar.', category: 'Taler' },
  
  // Konto & Support (2)
  { q: 'Wie lösche ich mein Konto?', a: 'E-Mail an datenschutz@radio2go.ch mit Betreff "Konto löschen".', category: 'Konto' },
  { q: 'Ich brauche Hilfe!', a: 'Schreib an support@radio2go.ch. Antwort innerhalb 24h.', category: 'Konto' },
  
  // Streaming / Geräte (5)
  { q: 'Wie höre ich Radio 2Go auf Chromecast?', a: 'Stream starten, Cast-Symbol antippen, Chromecast auswählen. Läuft direkt auf dem TV/Lautsprecher.', category: 'Streaming' },
  { q: 'Wie höre ich Radio 2Go über AirPlay?', a: 'iPhone/iPad: Kontrollzentrum öffnen (wischen), AirPlay-Symbol tippen, Gerät wählen. Mac: Menüleiste → AirPlay.', category: 'Streaming' },
  { q: 'Kann ich Radio 2Go auf Sonos hören?', a: 'Ja! Sonos App → Durchsuchen → Radio by TuneIn → "Radio 2Go" suchen. Oder: radio2go.fm/stream als Favorit hinzufügen.', category: 'Streaming' },
  { q: 'Wie höre ich Radio 2Go auf Alexa?', a: '"Alexa, spiele Radio 2Go" oder via TuneIn Skill. Einmal einrichten, dann per Sprachbefehl starten.', category: 'Streaming' },
  { q: 'Kann ich auf mehreren Geräten gleichzeitig hören?', a: 'Ja, aber jedes Gerät braucht eine eigene Verbindung. Bluetooth-Kopfhörer: Nur eines gleichzeitig möglich (Geräte-Limit).', category: 'Streaming' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function generateRedemptionCode(): string {
  return 'RDM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateQRPayload(redemptionId: string, code: string): string {
  // In production, this would be a signed JWT or encrypted payload
  return btoa(JSON.stringify({ rid: redemptionId, code, ts: Date.now() }));
}

// ============================================================================
// API CLIENT - SESSION (Cookie-based)
// ============================================================================

// Mock session state (simulates httpOnly cookie in mock mode)
let mockSessionActive = false;
let mockSessionData: SessionResponse | null = null;

/**
 * Exchange URL token for cookie session
 * In production: Gateway validates token with Boomerangme, sets httpOnly cookie
 * In mock: Just activates the session
 */
export async function exchangeTokenForSession(token: string): Promise<SessionStartResponse> {
  if (USE_MOCK) {
    await delay(300);
    // Simulate valid tokens
    if (token === 'demo' || token.startsWith('valid-') || token.length >= 4) {
      mockSessionActive = true;
      mockSessionData = {
        hasSession: true,
        memberId: 'member-123',
        displayName: 'Max',
        balance: 245,
        pendingBalance: 30,
        lifetimeBalance: 1250,
        tier: 'Gold',
        passLink: 'https://boomerangme.biz/pass/abc123',
      };
      return { success: true };
    }
    return { success: false, message: 'Invalid token' };
  }
  
  const response = await fetch(`${API_BASE}/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Accept cookies from Gateway
    body: JSON.stringify({ token }),
  });
  return response.json();
}

/**
 * Get current session from cookie
 * In production: Gateway reads httpOnly cookie, returns session data
 * In mock: Returns mock session state
 */
export async function getCurrentSession(): Promise<SessionResponse> {
  if (USE_MOCK) {
    await delay(200);
    if (mockSessionActive && mockSessionData) {
      return mockSessionData;
    }
    return { hasSession: false };
  }
  
  const response = await fetch(`${API_BASE}/me`, {
    credentials: 'include', // Send cookies to Gateway
  });
  
  if (!response.ok) {
    return { hasSession: false };
  }
  
  return response.json();
}

/**
 * Refresh balance from server
 */
export async function refreshSessionBalance(): Promise<TalerBalance> {
  if (USE_MOCK) {
    await delay(200);
    if (mockSessionActive && mockSessionData) {
      return {
        current: mockSessionData.balance || 245,
        pending: mockSessionData.pendingBalance || 30,
        lifetime: mockSessionData.lifetimeBalance || 1250,
      };
    }
    throw new Error('No active session');
  }
  
  const response = await fetch(`${API_BASE}/me/balance`, {
    credentials: 'include',
  });
  return response.json();
}

/**
 * Logout and clear session
 * In production: Gateway clears httpOnly cookie
 * In mock: Clears mock session state
 */
export async function logoutSession(): Promise<void> {
  if (USE_MOCK) {
    await delay(200);
    mockSessionActive = false;
    mockSessionData = null;
    return;
  }
  
  await fetch(`${API_BASE}/session/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

// Legacy function for backward compatibility
export async function getMe(token: string): Promise<MemberProfile> {
  if (USE_MOCK) {
    await delay(200);
    return {
      memberId: 'member-123',
      firstName: 'Max',
      balance: 245,
      tier: 'Gold',
      passLink: 'https://boomerangme.biz/pass/abc123',
    };
  }
  
  const response = await fetch(`${API_BASE}/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

// ============================================================================
// API CLIENT - REWARDS
// ============================================================================

export interface RewardQueryParams {
  query?: string;
  category?: string;
  partnerId?: string;
  maxCost?: number;
  sort?: string;
  lat?: number;
  lng?: number;
}

export async function fetchRewards(params?: RewardQueryParams): Promise<{ items: RewardListItem[] }> {
  if (USE_MOCK) {
    await delay(300);
    let items = [...MOCK_REWARDS];
    
    if (params?.category && params.category !== 'all') {
      items = items.filter(r => r.category === params.category);
    }
    if (params?.partnerId) {
      items = items.filter(r => {
        const detail = MOCK_REWARD_DETAILS[r.id];
        return detail?.partner.id === params.partnerId;
      });
    }
    if (params?.maxCost) {
      items = items.filter(r => r.cost <= params.maxCost!);
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      items = items.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.partnerName.toLowerCase().includes(q)
      );
    }
    
    return { items };
  }
  
  const searchParams = new URLSearchParams();
  if (params?.query) searchParams.set('query', params.query);
  if (params?.category) searchParams.set('category', params.category);
  if (params?.partnerId) searchParams.set('partnerId', params.partnerId);
  if (params?.maxCost) searchParams.set('maxCost', params.maxCost.toString());
  if (params?.sort) searchParams.set('sort', params.sort);
  if (params?.lat) searchParams.set('lat', params.lat.toString());
  if (params?.lng) searchParams.set('lng', params.lng.toString());
  
  const response = await fetch(`${API_BASE}/rewards?${searchParams}`);
  return response.json();
}

export async function fetchRewardById(id: string): Promise<RewardDetail | null> {
  if (USE_MOCK) {
    await delay(200);
    return MOCK_REWARD_DETAILS[id] || null;
  }
  
  const response = await fetch(`${API_BASE}/rewards/${id}`);
  if (!response.ok) return null;
  return response.json();
}

export async function redeemRewardById(rewardId: string): Promise<RewardRedemptionResult> {
  if (USE_MOCK) {
    await delay(800);
    const redemptionId = 'rdm-' + Math.random().toString(36).substring(2, 10);
    const code = generateRedemptionCode();
    // Update mock session balance
    if (mockSessionData) {
      mockSessionData.balance = (mockSessionData.balance || 245) - 50;
    }
    return {
      redemptionId,
      redemptionCode: code,
      qrPayload: generateQRPayload(redemptionId, code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
      newBalance: mockSessionData?.balance || 195,
    };
  }
  
  const response = await fetch(`${API_BASE}/rewards/${rewardId}/redeem`, {
    method: 'POST',
    credentials: 'include', // Cookie-based auth
  });
  return response.json();
}

export async function getRedemptionStatus(redemptionId: string): Promise<RedemptionStatus> {
  if (USE_MOCK) {
    await delay(200);
    return {
      status: 'created',
      partnerName: 'Café Sonnenschein',
      cost: 50,
      balanceAfter: mockSessionData?.balance || 195,
    };
  }
  
  const response = await fetch(`${API_BASE}/redemptions/${redemptionId}`, {
    credentials: 'include', // Cookie-based auth
  });
  return response.json();
}

// ============================================================================
// API CLIENT - CODES
// ============================================================================

export async function redeemOnAirCode(code: string): Promise<CodeRedeemResponse> {
  if (USE_MOCK) {
    await delay(1000);
    
    // Check if session is active
    if (!mockSessionActive) {
      return { status: 'invalid', message: 'Bitte öffne zuerst deine My 2Go Karte.' };
    }
    
    if (code.length < 4) {
      return { status: 'invalid', message: 'Code ist zu kurz. Bitte überprüfe deine Eingabe.' };
    }
    if (code.toUpperCase() === 'INVALID') {
      return { status: 'invalid', message: 'Dieser Code ist ungültig.' };
    }
    if (code.toUpperCase() === 'EXPIRED') {
      return { status: 'expired', message: 'Dieser Code ist leider abgelaufen.' };
    }
    if (code.toUpperCase() === 'USED') {
      return { status: 'used', message: 'Du hast diesen Code bereits eingelöst.' };
    }
    if (code.toUpperCase() === 'LIMIT') {
      return { status: 'rate_limited', message: 'Du hast heute zu viele Codes eingelöst. Versuch es morgen wieder.' };
    }
    
    const pointsAwarded = Math.floor(Math.random() * 50) + 10;
    // Update mock session balance
    if (mockSessionData) {
      mockSessionData.balance = (mockSessionData.balance || 245) + pointsAwarded;
    }
    return {
      status: 'ok',
      pointsAwarded,
      newBalance: mockSessionData?.balance || 245 + pointsAwarded,
      message: `Super! Du hast ${pointsAwarded} 2Go Taler erhalten!`,
    };
  }
  
  const response = await fetch(`${API_BASE}/codes/redeem`, {
    method: 'POST',
    credentials: 'include', // Cookie-based auth
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  return response.json();
}

// ============================================================================
// API CLIENT - PARTNERS
// ============================================================================

export interface PartnerQueryParams {
  category?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  query?: string;
}

export async function fetchPartners(params?: PartnerQueryParams): Promise<{ items: PartnerListItem[] }> {
  if (USE_MOCK) {
    await delay(300);
    let items = [...MOCK_PARTNERS];
    
    if (params?.category) {
      items = items.filter(p => p.category === params.category);
    }
    if (params?.query) {
      const q = params.query.toLowerCase();
      items = items.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      );
    }
    
    return { items };
  }
  
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.lat) searchParams.set('lat', params.lat.toString());
  if (params?.lng) searchParams.set('lng', params.lng.toString());
  if (params?.radiusKm) searchParams.set('radiusKm', params.radiusKm.toString());
  if (params?.query) searchParams.set('query', params.query);
  
  const response = await fetch(`${API_BASE}/partners?${searchParams}`);
  return response.json();
}

export async function fetchPartnerById(id: string): Promise<PartnerDetail | null> {
  if (USE_MOCK) {
    await delay(200);
    return MOCK_PARTNER_DETAILS[id] || null;
  }
  
  const response = await fetch(`${API_BASE}/partners/${id}`);
  if (!response.ok) return null;
  return response.json();
}

export async function fetchPartnerRewards(partnerId: string): Promise<{ items: PartnerRewardItem[] }> {
  if (USE_MOCK) {
    await delay(200);
    const items = MOCK_REWARDS
      .filter(r => MOCK_REWARD_DETAILS[r.id]?.partner.id === partnerId)
      .map(r => ({
        id: r.id,
        title: r.title,
        cost: r.cost,
        summary: r.summary,
      }));
    return { items };
  }
  
  const response = await fetch(`${API_BASE}/partners/${partnerId}/rewards`);
  return response.json();
}

// ============================================================================
// API CLIENT - FAQ
// ============================================================================

export async function fetchFAQ(): Promise<{ items: FAQItem[] }> {
  if (USE_MOCK) {
    await delay(200);
    return { items: MOCK_FAQ };
  }
  
  const response = await fetch(`${API_BASE}/faq`);
  return response.json();
}

// ============================================================================
// API CLIENT - SUPPORT
// ============================================================================

export async function createSupportTicket(request: SupportTicketRequest): Promise<SupportTicketResponse> {
  if (USE_MOCK) {
    await delay(500);
    return {
      ticketId: 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'created',
    };
  }
  
  const response = await fetch(`${API_BASE}/support/ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return response.json();
}

// ============================================================================
// LEGACY COMPATIBILITY LAYER
// These functions maintain backward compatibility with existing components
// ============================================================================

export async function validateSession(token: string | null): Promise<Session> {
  if (!token) return { valid: false };
  
  if (USE_MOCK) {
    await delay(300);
    if (token.startsWith('valid-') || token === 'demo' || token.startsWith('mock-session-')) {
      const profile = await getMe(token);
      return {
        valid: true,
        userId: profile.memberId,
        displayName: profile.firstName,
      };
    }
    return { valid: false };
  }
  
  try {
    const profile = await getMe(token);
    return {
      valid: true,
      userId: profile.memberId,
      displayName: profile.firstName,
    };
  } catch {
    return { valid: false };
  }
}

export async function getBalance(token: string): Promise<TalerBalance> {
  const profile = await getMe(token);
  return {
    current: profile.balance,
    pending: 30, // Mock pending
    lifetime: 1250, // Mock lifetime
  };
}

export async function getRewards(category?: string): Promise<Reward[]> {
  const result = await fetchRewards({ category });
  return result.items.map(item => ({
    id: item.id,
    title: item.title,
    description: item.summary,
    cost: item.cost,
    category: item.category,
    partnerId: MOCK_REWARD_DETAILS[item.id]?.partner.id || '',
    partnerName: item.partnerName,
    imageUrl: item.imageUrl,
    available: true,
    expiresAt: MOCK_REWARD_DETAILS[item.id]?.validUntil,
  }));
}

export async function getRewardById(id: string): Promise<Reward | null> {
  const detail = await fetchRewardById(id);
  if (!detail) return null;
  
  return {
    id: detail.id,
    title: detail.title,
    description: detail.description,
    cost: detail.cost,
    category: MOCK_REWARDS.find(r => r.id === id)?.category || 'product',
    partnerId: detail.partner.id,
    partnerName: detail.partner.name,
    available: true,
    expiresAt: detail.validUntil,
  };
}

export async function getPartners(): Promise<Partner[]> {
  const result = await fetchPartners();
  return result.items.map(item => {
    const detail = MOCK_PARTNER_DETAILS[item.id];
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      description: detail?.address || '',
      address: detail?.address || '',
      city: item.city,
      lat: 46.9480,
      lng: 7.4474,
      rewardCount: MOCK_REWARDS.filter(r => MOCK_REWARD_DETAILS[r.id]?.partner.id === item.id).length,
    };
  });
}

export async function getPartnerById(id: string): Promise<Partner | null> {
  const detail = await fetchPartnerById(id);
  const listItem = MOCK_PARTNERS.find(p => p.id === id);
  if (!detail) return null;
  
  return {
    id: detail.id,
    name: detail.name,
    category: detail.category,
    description: detail.openingHours || '',
    address: detail.address,
    city: listItem?.city,
    lat: 46.9480,
    lng: 7.4474,
    rewardCount: MOCK_REWARDS.filter(r => MOCK_REWARD_DETAILS[r.id]?.partner.id === id).length,
  };
}

export async function getPartnerRewards(partnerId: string): Promise<Reward[]> {
  const result = await fetchPartnerRewards(partnerId);
  return result.items.map(item => ({
    id: item.id,
    title: item.title,
    description: item.summary,
    cost: item.cost,
    category: MOCK_REWARDS.find(r => r.id === item.id)?.category || 'product',
    partnerId,
    partnerName: MOCK_PARTNER_DETAILS[partnerId]?.name || '',
    available: true,
  }));
}

export async function redeemReward(rewardId: string): Promise<RedemptionResult> {
  const result = await redeemRewardById(rewardId);
  return {
    success: true,
    message: 'Reward erfolgreich eingelöst!',
    newBalance: result.newBalance,
    redemptionCode: result.redemptionCode,
  };
}

export async function redeemCode(code: string): Promise<CodeRedeemResult> {
  const result = await redeemOnAirCode(code);
  return {
    success: result.status === 'ok',
    message: result.message,
    pointsEarned: result.pointsAwarded,
    newBalance: result.newBalance,
  };
}

// Legacy FAQ export with category
export const FAQ_ITEMS = MOCK_FAQ.map(item => ({
  question: item.q,
  answer: item.a,
  category: item.category,
}));

// ============================================================================
// API CLIENT - REGIONS (extracted from partner data)
// ============================================================================

export interface Region {
  id: string;
  name: string;
  partnerCount: number;
}

/**
 * Get available regions based on partner locations
 * In production: This would come from Boomerangme API
 */
export async function getRegions(): Promise<Region[]> {
  if (USE_MOCK) {
    await delay(100);
    // Extract unique cities from partners and count
    const cityCount: Record<string, number> = {};
    MOCK_PARTNERS.forEach(p => {
      if (p.city) {
        cityCount[p.city] = (cityCount[p.city] || 0) + 1;
      }
    });
    
    return Object.entries(cityCount)
      .map(([city, count]) => ({
        id: city.toLowerCase().replace(/\s+/g, '-'),
        name: city,
        partnerCount: count,
      }))
      .sort((a, b) => b.partnerCount - a.partnerCount);
  }
  
  const response = await fetch(`${API_BASE}/regions`);
  return response.json();
}

/**
 * Get rewards near a location with distance information
 * In production: This would filter by geo-coordinates from Boomerangme
 */
export async function getRewardsNearLocation(lat: number, lng: number, radiusKm: number = 50): Promise<Reward[]> {
  if (USE_MOCK) {
    await delay(200);
    
    // Mock partner coordinates (would come from API in production)
    const partnerCoords: Record<string, { lat: number; lng: number }> = {
      'p1': { lat: 47.4843, lng: 8.2073 }, // Brugg
      'p2': { lat: 47.4703, lng: 8.3166 }, // Wettingen
      'p3': { lat: 47.3896, lng: 8.0450 }, // Aarau
      'p4': { lat: 47.4843, lng: 8.2073 }, // Brugg
      'p5': { lat: 47.4625, lng: 8.1813 }, // Habsburg
      'p6': { lat: 47.5875, lng: 8.2917 }, // Bad Zurzach
      'p7': { lat: 47.4727, lng: 8.3063 }, // Baden
      'p8': { lat: 47.4800, lng: 8.2200 }, // Windisch
      'p9': { lat: 47.5833, lng: 8.2333 }, // Leuggern
      'radio2go': { lat: 47.4843, lng: 8.2073 }, // Brugg
      'p10': { lat: 47.1389, lng: 9.5208 }, // Vaduz
      'p11': { lat: 47.1613, lng: 9.5099 }, // Schaan
      'p12': { lat: 47.0733, lng: 9.5000 }, // Balzers
      'p13': { lat: 47.1000, lng: 9.6000 }, // Malbun
    };
    
    // Calculate distances and filter
    const rewardsWithDistance = MOCK_REWARDS.map(item => {
      const detail = MOCK_REWARD_DETAILS[item.id];
      const partnerId = detail?.partner.id;
      const coords = partnerId ? partnerCoords[partnerId] : null;
      
      let distance = 999;
      if (coords) {
        // Haversine formula
        const R = 6371;
        const dLat = (coords.lat - lat) * Math.PI / 180;
        const dLon = (coords.lng - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }
      
      return {
        id: item.id,
        title: item.title,
        description: item.summary,
        cost: item.cost,
        category: item.category,
        partnerId: detail?.partner.id || '',
        partnerName: item.partnerName,
        imageUrl: item.imageUrl,
        available: true,
        expiresAt: detail?.validUntil,
        distanceKm: Math.round(distance * 10) / 10,
      };
    });
    
    // Filter by radius and sort by distance
    return rewardsWithDistance
      .filter(r => r.distanceKm <= radiusKm)
      .sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
  }
  
  const response = await fetch(`${API_BASE}/rewards?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`);
  const data = await response.json();
  return data.items;
}
