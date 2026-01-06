/**
 * 2Go Taler Hub - Mock Gateway API
 * 
 * This file contains all API contracts and mock data.
 * In production, these calls will be routed through a real gateway
 * that communicates with Boomerangme (loyalty) and GoHighLevel (CRM).
 * 
 * IMPORTANT: Lovable stores NO data. All data comes from the gateway.
 */

// Types
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

// Mock Data
const MOCK_REWARDS: Reward[] = [
  {
    id: 'r1',
    title: 'Kaffee-Upgrade',
    description: 'Gratis Upgrade auf die nächste Grösse bei jedem Kaffee.',
    cost: 50,
    category: 'discount',
    partnerId: 'p1',
    partnerName: 'Café Sonnenschein',
    available: true,
  },
  {
    id: 'r2',
    title: 'Gratis Dessert',
    description: 'Ein Dessert deiner Wahl kostenlos zu deiner Bestellung.',
    cost: 100,
    category: 'product',
    partnerId: 'p2',
    partnerName: 'Restaurant Seeblick',
    available: true,
  },
  {
    id: 'r3',
    title: '2-für-1 Museum',
    description: 'Zweite Person gratis ins Kunstmuseum.',
    cost: 75,
    category: 'discount',
    partnerId: 'p3',
    partnerName: 'Kunstmuseum Bern',
    available: true,
  },
  {
    id: 'r4',
    title: 'Studio-Besuch',
    description: 'Exklusiver Blick hinter die Kulissen von Radio 2Go.',
    cost: 200,
    category: 'exclusive',
    partnerId: 'radio2go',
    partnerName: 'Radio 2Go',
    available: true,
  },
  {
    id: 'r5',
    title: 'Song-Wunsch-Tag',
    description: 'Wähle einen Song, der live auf Radio 2Go gespielt wird.',
    cost: 150,
    category: 'experience',
    partnerId: 'radio2go',
    partnerName: 'Radio 2Go',
    available: true,
  },
  {
    id: 'r6',
    title: 'Probetraining',
    description: 'Gratis Probetraining im Fitnessstudio.',
    cost: 80,
    category: 'experience',
    partnerId: 'p4',
    partnerName: 'FitLife Studio',
    available: true,
  },
  {
    id: 'r7',
    title: 'Geburtstagswunsch on Air',
    description: 'Dein persönlicher Geburtstagsgruss wird live gesendet.',
    cost: 100,
    category: 'exclusive',
    partnerId: 'radio2go',
    partnerName: 'Radio 2Go',
    available: true,
  },
  {
    id: 'r8',
    title: 'Kinder-Menü gratis',
    description: 'Ein Kinder-Menü kostenlos bei jedem Erwachsenen-Menü.',
    cost: 60,
    category: 'product',
    partnerId: 'p2',
    partnerName: 'Restaurant Seeblick',
    available: true,
  },
];

const MOCK_PARTNERS: Partner[] = [
  {
    id: 'p1',
    name: 'Café Sonnenschein',
    category: 'Gastronomie',
    description: 'Gemütliches Café mit hausgemachten Kuchen und Spezialitäten.',
    address: 'Hauptstrasse 12, 3000 Bern',
    lat: 46.9480,
    lng: 7.4474,
    rewardCount: 2,
  },
  {
    id: 'p2',
    name: 'Restaurant Seeblick',
    category: 'Gastronomie',
    description: 'Regionale Küche mit Blick auf den See.',
    address: 'Seeweg 45, 3600 Thun',
    lat: 46.7580,
    lng: 7.6280,
    rewardCount: 3,
  },
  {
    id: 'p3',
    name: 'Kunstmuseum Bern',
    category: 'Kultur',
    description: 'Eines der wichtigsten Kunstmuseen der Schweiz.',
    address: 'Hodlerstrasse 8, 3011 Bern',
    lat: 46.9441,
    lng: 7.4513,
    rewardCount: 1,
  },
  {
    id: 'p4',
    name: 'FitLife Studio',
    category: 'Sport & Fitness',
    description: 'Modernes Fitnessstudio mit persönlicher Betreuung.',
    address: 'Sportweg 5, 3008 Bern',
    lat: 46.9550,
    lng: 7.4380,
    rewardCount: 2,
  },
  {
    id: 'radio2go',
    name: 'Radio 2Go',
    category: 'Erlebnis',
    description: 'Dein Schweizer Lieblingsradio.',
    address: 'Radiostrasse 1, 3000 Bern',
    lat: 46.9510,
    lng: 7.4400,
    rewardCount: 3,
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Functions (Mock Implementation)

export async function validateSession(token: string | null): Promise<Session> {
  await delay(300);
  
  if (!token) {
    return { valid: false };
  }
  
  // Mock: Any token starting with 'valid-' is valid
  if (token.startsWith('valid-') || token === 'demo') {
    return {
      valid: true,
      userId: 'user-123',
      displayName: 'Max',
    };
  }
  
  return { valid: false };
}

export async function getBalance(token: string): Promise<TalerBalance> {
  await delay(400);
  
  // Mock balance
  return {
    current: 245,
    pending: 30,
    lifetime: 1250,
  };
}

export async function getRewards(category?: string): Promise<Reward[]> {
  await delay(300);
  
  if (category && category !== 'all') {
    return MOCK_REWARDS.filter(r => r.category === category);
  }
  
  return MOCK_REWARDS;
}

export async function getRewardById(id: string): Promise<Reward | null> {
  await delay(200);
  return MOCK_REWARDS.find(r => r.id === id) || null;
}

export async function getPartners(): Promise<Partner[]> {
  await delay(300);
  return MOCK_PARTNERS;
}

export async function getPartnerById(id: string): Promise<Partner | null> {
  await delay(200);
  return MOCK_PARTNERS.find(p => p.id === id) || null;
}

export async function getPartnerRewards(partnerId: string): Promise<Reward[]> {
  await delay(200);
  return MOCK_REWARDS.filter(r => r.partnerId === partnerId);
}

export async function redeemReward(token: string, rewardId: string): Promise<RedemptionResult> {
  await delay(800);
  
  const reward = MOCK_REWARDS.find(r => r.id === rewardId);
  
  if (!reward) {
    return {
      success: false,
      message: 'Reward nicht gefunden.',
    };
  }
  
  // Mock: Always succeed
  return {
    success: true,
    message: 'Reward erfolgreich eingelöst!',
    newBalance: 195, // Mock new balance
    redemptionCode: 'RDM-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
  };
}

export async function redeemCode(token: string, code: string): Promise<CodeRedeemResult> {
  await delay(1000);
  
  // Mock validation
  if (code.length < 4) {
    return {
      success: false,
      message: 'Code ist zu kurz. Bitte überprüfe deine Eingabe.',
    };
  }
  
  if (code.toUpperCase() === 'INVALID') {
    return {
      success: false,
      message: 'Dieser Code ist ungültig oder bereits eingelöst.',
    };
  }
  
  if (code.toUpperCase() === 'EXPIRED') {
    return {
      success: false,
      message: 'Dieser Code ist leider abgelaufen.',
    };
  }
  
  // Mock success
  const pointsEarned = Math.floor(Math.random() * 50) + 10;
  
  return {
    success: true,
    message: `Super! Du hast ${pointsEarned} 2Go Taler erhalten!`,
    pointsEarned,
    newBalance: 245 + pointsEarned,
  };
}

// FAQ Content
export const FAQ_ITEMS = [
  {
    question: 'Was sind 2Go Taler?',
    answer: '2Go Taler sind Bonuspunkte, die du bei Radio 2Go Partnerunternehmen sammeln und gegen exklusive Prämien einlösen kannst. Sie sind nicht gegen Bargeld eintauschbar.',
  },
  {
    question: 'Wie sammle ich 2Go Taler?',
    answer: 'Zeige bei jedem Einkauf bei einem Partner deine digitale Karte vor. Du erhältst automatisch Taler gutgeschrieben. Zusätzlich kannst du On-Air Codes aus dem Radio einlösen.',
  },
  {
    question: 'Wo finde ich meine Taler-Karte?',
    answer: 'Deine digitale Taler-Karte erhältst du per Link in deiner Wallet-App oder per E-Mail. Klicke einfach auf den Link, um deinen Kontostand zu sehen.',
  },
  {
    question: 'Was ist ein On-Air Code?',
    answer: 'On-Air Codes werden während der Sendung auf Radio 2Go genannt. Gib den Code in der App ein und erhalte Bonus-Taler!',
  },
  {
    question: 'Wie löse ich einen Reward ein?',
    answer: 'Wähle einen Reward aus, klicke auf "Einlösen" und zeige den erhaltenen Code beim Partner vor. Deine Taler werden sofort abgezogen.',
  },
  {
    question: 'Verfallen meine Taler?',
    answer: 'Taler verfallen nach 24 Monaten Inaktivität. Solange du regelmässig sammelst oder einlöst, bleiben sie gültig.',
  },
  {
    question: 'Kann ich Taler an andere übertragen?',
    answer: 'Nein, Taler sind an dein Konto gebunden und nicht übertragbar.',
  },
  {
    question: 'Kann ich Taler in Bargeld umtauschen?',
    answer: 'Nein, 2Go Taler sind Bonuspunkte und können nur gegen Rewards bei Partnern eingelöst werden. Eine Barauszahlung ist nicht möglich.',
  },
  {
    question: 'Wie werde ich Partner?',
    answer: 'Kontaktiere uns unter partner@radio2go.ch und werde Teil des 2Go Taler Netzwerks.',
  },
  {
    question: 'Mein Code funktioniert nicht – was tun?',
    answer: 'Überprüfe die Gross-/Kleinschreibung. Codes sind 24 Stunden gültig und können nur einmal eingelöst werden.',
  },
  {
    question: 'Wie kann ich meinen Account löschen?',
    answer: 'Sende eine E-Mail an datenschutz@radio2go.ch mit dem Betreff "Konto löschen".',
  },
  {
    question: 'Wo finde ich die Datenschutzerklärung?',
    answer: 'Die vollständige Datenschutzerklärung findest du auf radio2go.ch/datenschutz.',
  },
];
