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

// Session & Auth
export interface SessionStartRequest {
  passIdOrPhoneOrEmail?: string;
}

export interface SessionStartResponse {
  token: string;
  expiresAt: string;
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
// ============================================================================

const MOCK_REWARDS: RewardListItem[] = [
  {
    id: 'r1',
    title: 'Kaffee-Upgrade',
    partnerName: 'Café Sonnenschein',
    category: 'discount',
    cost: 50,
    summary: 'Gratis Upgrade auf die nächste Grösse',
    badges: ['Beliebt'],
    imageUrl: undefined,
  },
  {
    id: 'r2',
    title: 'Gratis Dessert',
    partnerName: 'Restaurant Seeblick',
    category: 'product',
    cost: 100,
    summary: 'Ein Dessert deiner Wahl kostenlos',
    badges: ['Neu'],
    imageUrl: undefined,
  },
  {
    id: 'r3',
    title: '2-für-1 Museum',
    partnerName: 'Kunstmuseum Bern',
    category: 'discount',
    cost: 75,
    summary: 'Zweite Person gratis ins Kunstmuseum',
    badges: ['Kultur'],
    imageUrl: undefined,
  },
  {
    id: 'r4',
    title: 'Studio-Besuch',
    partnerName: 'Radio 2Go',
    category: 'exclusive',
    cost: 200,
    summary: 'Exklusiver Blick hinter die Kulissen',
    badges: ['Exklusiv', 'Radio 2Go'],
    imageUrl: undefined,
  },
  {
    id: 'r5',
    title: 'Song-Wunsch-Tag',
    partnerName: 'Radio 2Go',
    category: 'experience',
    cost: 150,
    summary: 'Wähle einen Song für die Sendung',
    badges: ['Radio 2Go'],
    imageUrl: undefined,
  },
  {
    id: 'r6',
    title: 'Probetraining',
    partnerName: 'FitLife Studio',
    category: 'experience',
    cost: 80,
    summary: 'Gratis Probetraining im Fitnessstudio',
    badges: ['Sport'],
    imageUrl: undefined,
  },
  {
    id: 'r7',
    title: 'Geburtstagswunsch on Air',
    partnerName: 'Radio 2Go',
    category: 'exclusive',
    cost: 100,
    summary: 'Dein Gruss wird live gesendet',
    badges: ['Radio 2Go', 'Beliebt'],
    imageUrl: undefined,
  },
  {
    id: 'r8',
    title: 'Kinder-Menü gratis',
    partnerName: 'Restaurant Seeblick',
    category: 'product',
    cost: 60,
    summary: 'Ein Kinder-Menü kostenlos',
    badges: ['Familie'],
    imageUrl: undefined,
  },
];

const MOCK_REWARD_DETAILS: Record<string, RewardDetail> = {
  r1: {
    id: 'r1',
    title: 'Kaffee-Upgrade',
    description: 'Erhalte ein kostenloses Upgrade auf die nächste Grösse bei jedem Kaffee. Gilt für alle Heissgetränke auf der Karte.',
    terms: ['Gültig für 1 Getränk pro Einlösung', 'Nicht kombinierbar mit anderen Aktionen', 'Zeige den Code an der Kasse'],
    cost: 50,
    partner: {
      id: 'p1',
      name: 'Café Sonnenschein',
      address: 'Hauptstrasse 12, 3000 Bern',
      openingHours: 'Mo-Fr 7:00-18:00, Sa 8:00-16:00',
    },
    limits: { perDay: 1, perUser: 5 },
    validUntil: '2026-12-31',
  },
  r2: {
    id: 'r2',
    title: 'Gratis Dessert',
    description: 'Geniesse ein Dessert deiner Wahl kostenlos zu deiner Bestellung. Wähle aus unserer Dessertkarte.',
    terms: ['Mindestbestellwert CHF 25', 'Dessert nach Verfügbarkeit', 'Nicht für Take-away'],
    cost: 100,
    partner: {
      id: 'p2',
      name: 'Restaurant Seeblick',
      address: 'Seeweg 45, 3600 Thun',
      openingHours: 'Di-So 11:30-22:00',
    },
    limits: { perUser: 3 },
  },
  r3: {
    id: 'r3',
    title: '2-für-1 Museum',
    description: 'Besuche das Kunstmuseum Bern zu zweit – die zweite Person kommt gratis rein!',
    terms: ['Gültig für regulären Eintritt', 'Nicht für Sonderausstellungen', 'Vorlage an der Kasse'],
    cost: 75,
    partner: {
      id: 'p3',
      name: 'Kunstmuseum Bern',
      address: 'Hodlerstrasse 8, 3011 Bern',
      openingHours: 'Di-So 10:00-17:00',
    },
  },
  r4: {
    id: 'r4',
    title: 'Studio-Besuch',
    description: 'Erlebe Radio 2Go hautnah! Besuche unser Studio während einer Live-Sendung und lerne das Team kennen.',
    terms: ['Nach Terminvereinbarung', 'Max. 2 Personen', 'Dauer ca. 45 Minuten'],
    cost: 200,
    partner: {
      id: 'radio2go',
      name: 'Radio 2Go',
      address: 'Radiostrasse 1, 3000 Bern',
      openingHours: 'Termine nach Absprache',
    },
    limits: { perUser: 1 },
  },
  r5: {
    id: 'r5',
    title: 'Song-Wunsch-Tag',
    description: 'Wähle deinen Lieblingssong und wir spielen ihn live auf Radio 2Go. Mit persönlicher Ansage!',
    terms: ['Song muss lizenziert sein', 'Ausstrahlung innerhalb von 7 Tagen', 'Persönliche Widmung möglich'],
    cost: 150,
    partner: {
      id: 'radio2go',
      name: 'Radio 2Go',
      address: 'Radiostrasse 1, 3000 Bern',
    },
  },
  r6: {
    id: 'r6',
    title: 'Probetraining',
    description: 'Teste unser Fitnessstudio mit einem kostenlosen Probetraining inkl. Einführung durch einen Trainer.',
    terms: ['Einmalig pro Person', 'Termin nach Verfügbarkeit', 'Sportkleider mitbringen'],
    cost: 80,
    partner: {
      id: 'p4',
      name: 'FitLife Studio',
      address: 'Sportweg 5, 3008 Bern',
      openingHours: 'Mo-Fr 6:00-22:00, Sa-So 8:00-20:00',
    },
    limits: { perUser: 1 },
  },
  r7: {
    id: 'r7',
    title: 'Geburtstagswunsch on Air',
    description: 'Lass deinen persönlichen Geburtstagsgruss live auf Radio 2Go senden. Perfekt für Freunde und Familie!',
    terms: ['Text max. 50 Wörter', 'Ausstrahlung am Geburtstag oder +/- 1 Tag', '3 Tage im Voraus anmelden'],
    cost: 100,
    partner: {
      id: 'radio2go',
      name: 'Radio 2Go',
      address: 'Radiostrasse 1, 3000 Bern',
    },
  },
  r8: {
    id: 'r8',
    title: 'Kinder-Menü gratis',
    description: 'Ein Kinder-Menü kostenlos zu jedem Erwachsenen-Hauptgericht. Für Kinder bis 12 Jahre.',
    terms: ['1 Kinder-Menü pro Erwachsenen-Menü', 'Nur vor Ort', 'Getränke nicht inbegriffen'],
    cost: 60,
    partner: {
      id: 'p2',
      name: 'Restaurant Seeblick',
      address: 'Seeweg 45, 3600 Thun',
      openingHours: 'Di-So 11:30-22:00',
    },
  },
};

const MOCK_PARTNERS: PartnerListItem[] = [
  { id: 'p1', name: 'Café Sonnenschein', category: 'Gastronomie', city: 'Bern', openNow: true, hasRewards: true },
  { id: 'p2', name: 'Restaurant Seeblick', category: 'Gastronomie', city: 'Thun', openNow: true, hasRewards: true },
  { id: 'p3', name: 'Kunstmuseum Bern', category: 'Kultur', city: 'Bern', openNow: false, hasRewards: true },
  { id: 'p4', name: 'FitLife Studio', category: 'Sport & Fitness', city: 'Bern', openNow: true, hasRewards: true },
  { id: 'radio2go', name: 'Radio 2Go', category: 'Erlebnis', city: 'Bern', openNow: true, hasRewards: true },
];

const MOCK_PARTNER_DETAILS: Record<string, PartnerDetail> = {
  p1: { id: 'p1', name: 'Café Sonnenschein', category: 'Gastronomie', address: 'Hauptstrasse 12, 3000 Bern', openingHours: 'Mo-Fr 7:00-18:00, Sa 8:00-16:00', phone: '+41 31 123 45 67' },
  p2: { id: 'p2', name: 'Restaurant Seeblick', category: 'Gastronomie', address: 'Seeweg 45, 3600 Thun', openingHours: 'Di-So 11:30-22:00', phone: '+41 33 987 65 43', website: 'https://seeblick-thun.ch' },
  p3: { id: 'p3', name: 'Kunstmuseum Bern', category: 'Kultur', address: 'Hodlerstrasse 8, 3011 Bern', openingHours: 'Di-So 10:00-17:00', website: 'https://kunstmuseumbern.ch' },
  p4: { id: 'p4', name: 'FitLife Studio', category: 'Sport & Fitness', address: 'Sportweg 5, 3008 Bern', openingHours: 'Mo-Fr 6:00-22:00, Sa-So 8:00-20:00', phone: '+41 31 555 44 33' },
  radio2go: { id: 'radio2go', name: 'Radio 2Go', category: 'Erlebnis', address: 'Radiostrasse 1, 3000 Bern', website: 'https://radio2go.fm', mapLink: 'https://maps.google.com/?q=Radio+2Go+Bern' },
};

const MOCK_FAQ: FAQItem[] = [
  // Grundlagen (3)
  { q: 'Was sind 2Go Taler?', a: 'Bonuspunkte von Radio 2Go. Sammeln bei Partnern, einlösen für Rewards. Nicht auszahlbar.', category: 'Grundlagen' },
  { q: 'Wie sammle ich Taler?', a: 'Karte beim Partner vorzeigen oder On-Air Codes aus dem Radio eingeben.', category: 'Grundlagen' },
  { q: 'Wo ist meine Karte?', a: 'Du erhältst einen Link per E-Mail oder Wallet. Damit öffnest du deine Karte.', category: 'Grundlagen' },
  
  // Rewards (4)
  { q: 'Wie löse ich einen Reward ein?', a: 'Reward wählen, einlösen, Code beim Partner vorzeigen. Nur vor Ort gültig.', category: 'Rewards' },
  { q: 'Wie lange ist der Einlösecode gültig?', a: '10 Minuten. Danach verfällt er, deine Taler bleiben erhalten.', category: 'Rewards' },
  { q: 'Kann ich Rewards zurückgeben?', a: 'Nein. Einmal eingelöst, kein Rücktausch möglich.', category: 'Rewards' },
  { q: 'Gibt es ein Limit pro Tag?', a: 'Ja, manche Rewards haben ein Tageslimit. Steht beim jeweiligen Reward.', category: 'Rewards' },
  
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
// API CLIENT - SESSION
// ============================================================================

export async function startSession(request?: SessionStartRequest): Promise<SessionStartResponse> {
  if (USE_MOCK) {
    await delay(300);
    const token = 'mock-session-' + Math.random().toString(36).substring(2, 10);
    return {
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
  
  const response = await fetch(`${API_BASE}/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request || {}),
  });
  return response.json();
}

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

export async function redeemRewardById(token: string, rewardId: string): Promise<RewardRedemptionResult> {
  if (USE_MOCK) {
    await delay(800);
    const redemptionId = 'rdm-' + Math.random().toString(36).substring(2, 10);
    const code = generateRedemptionCode();
    return {
      redemptionId,
      redemptionCode: code,
      qrPayload: generateQRPayload(redemptionId, code),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      newBalance: 195,
    };
  }
  
  const response = await fetch(`${API_BASE}/rewards/${rewardId}/redeem`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

export async function getRedemptionStatus(token: string, redemptionId: string): Promise<RedemptionStatus> {
  if (USE_MOCK) {
    await delay(200);
    return {
      status: 'created',
      partnerName: 'Café Sonnenschein',
      cost: 50,
      balanceAfter: 195,
    };
  }
  
  const response = await fetch(`${API_BASE}/redemptions/${redemptionId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}

// ============================================================================
// API CLIENT - CODES
// ============================================================================

export async function redeemOnAirCode(token: string, code: string): Promise<CodeRedeemResponse> {
  if (USE_MOCK) {
    await delay(1000);
    
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
    return {
      status: 'ok',
      pointsAwarded,
      newBalance: 245 + pointsAwarded,
      message: `Super! Du hast ${pointsAwarded} 2Go Taler erhalten!`,
    };
  }
  
  const response = await fetch(`${API_BASE}/codes/redeem`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
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

export async function redeemReward(token: string, rewardId: string): Promise<RedemptionResult> {
  const result = await redeemRewardById(token, rewardId);
  return {
    success: true,
    message: 'Reward erfolgreich eingelöst!',
    newBalance: result.newBalance,
    redemptionCode: result.redemptionCode,
  };
}

export async function redeemCode(token: string, code: string): Promise<CodeRedeemResult> {
  const result = await redeemOnAirCode(token, code);
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
