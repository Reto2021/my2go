// =============================================================
// MY2GO PARTNER FIT QUIZ - CONFIGURATION
// =============================================================
// All constants, texts, and calculations are configurable here

// -------------------------------------------------------------
// PLANS
// -------------------------------------------------------------
export const QUIZ_PLANS = [
  { 
    key: 'start' as const, 
    name: 'Starter', 
    priceCHF: 249, 
    includesGHL: false, 
    recommendedFor: ['1 Standort', 'Basis Loyalty + Deals'], 
    modules: ['loyalty', 'deals'] 
  },
  { 
    key: 'plus' as const, 
    name: 'Growth', 
    priceCHF: 499, 
    includesGHL: true, 
    recommendedFor: ['mehr Aktivierung', 'Automation'], 
    modules: ['loyalty', 'automation'] 
  },
  { 
    key: 'pro' as const, 
    name: 'Radio Partner', 
    priceCHF: 990, 
    includesGHL: true, 
    recommendedFor: ['Multi-Standort', 'hohe Frequenz'], 
    modules: ['loyalty', 'automation', 'campaigns'] 
  }
] as const;

export type PlanKey = typeof QUIZ_PLANS[number]['key'];

// -------------------------------------------------------------
// MODULES
// -------------------------------------------------------------
export const MODULES = {
  loyalty: { title: 'Multipartner-Loyalty', desc: 'Sammeln & Einlösen (Taler) im Partnernetzwerk' },
  deals: { title: 'Deals/Gutscheine', desc: 'Angebote, Rewards, Partneraktionen' },
  reviews: { title: 'Review-Booster', desc: 'Bewertungen systematisch auslösen & steuern' },
  automation: { title: 'Automatische Reminder', desc: 'Follow-up E-Mails, SMS & WhatsApp automatisch versenden' },
  crmLite: { title: 'Kundenerfassung/CRM Light', desc: 'Kundendaten strukturiert erfassen & segmentieren' },
  sponsor: { title: 'Sponsoring-Slots', desc: 'Sponsor-Badges in Deals + Präsenzpakete' }
} as const;

export type ModuleKey = keyof typeof MODULES;

// -------------------------------------------------------------
// CLICKOUTS
// -------------------------------------------------------------
export const CLICKOUTS = [
  { label: 'Internet/Telekom vergleichen', url: 'https://www.moneyland.ch/de/internet-abo-vergleich', lever: 'telco' },
  { label: 'Telekom-Übersicht', url: 'https://www.moneyland.ch/de/telekom', lever: 'telco' },
  { label: 'Firmenkonto vergleichen', url: 'https://www.moneyland.ch/de/firmenkonto-vergleich', lever: 'bank' },
  { label: 'Versicherungen vergleichen', url: 'https://www.comparis.ch/versicherung', lever: 'insurance' },
  { label: 'UVG Firmen-Überblick', url: 'https://www.moneyland.ch/de/unfallversicherung-firma-vergleich', lever: 'insurance' },
  { label: 'ElCom Tarif-Benchmark (Grundversorgung)', url: 'https://www.strompreis.elcom.admin.ch/', lever: 'energy' },
  { label: 'Gewerbemiete Marktcheck (Homegate)', url: 'https://www.homegate.ch/mieten/gewerbeobjekt/trefferliste', lever: 'rent' },
  { label: 'Gewerbemiete Marktcheck (ImmoScout24)', url: 'https://www.immoscout24.ch/de/buero-gewerbe-industrie/mieten', lever: 'rent' },
  { label: 'Bürobedarf Preisvergleich', url: 'https://www.toppreise.ch/produktsuche/Buerobedarf-Schreibwaren-c1816', lever: 'supplies' }
] as const;

// -------------------------------------------------------------
// RANGES / MIDPOINTS
// -------------------------------------------------------------
export const RANGE_MIDPOINTS = {
  transactions: { '<30': 20, '30-79': 55, '80-199': 130, '200+': 250 },
  avgTicket: { '<30': 20, '30-79': 55, '80-199': 130, '200+': 250 },
  loyalty: { '<20%': 10, '20-39%': 30, '40-59%': 50, '60%+': 70 },
  leads: { '<10': 5, '10-49': 30, '50-199': 100, '200+': 250 },
  conversion: { '<10%': 5, '10-24%': 17, '25-49%': 35, '50%+': 60 },
  contacts: { '<500': 300, '500-1999': 1000, '2000-9999': 5000, '10000+': 15000 }
} as const;

// -------------------------------------------------------------
// FIXKOSTEN SAVINGS PERCENTAGES
// -------------------------------------------------------------
export const FIXCOST_SAVINGS = {
  telco: { threshold: 80, savingsPct: 0.15 },
  software: { threshold: 150, savingsPct: 0.10 },
  treuhand: { threshold: 300, savingsPct: 0.15 },
  insurance: { threshold: 200, savingsPct: 0.10 },
  mobility: { threshold: 200, savingsPct: 0.10 },
  bank: { threshold: 50, savingsPct: 0.10 },
  rent: { threshold: 2500, savingsPct: 0.05, requiresNegotiation: true },
  web: { ranges: [
    { min: 20, max: 59, savingsPct: 0.10 },
    { min: 60, max: 149, savingsPct: 0.15 },
    { min: 150, max: Infinity, savingsPct: 0.20 }
  ]}
} as const;

// Time savings
export const TIME_SAVINGS = {
  hourlyRate: 90,
  hoursFor2Gaps: 2,
  hoursFor4Gaps: 4
} as const;

// -------------------------------------------------------------
// SPONSORING POTENTIAL (CHF/month)
// -------------------------------------------------------------
export const SPONSORING_POTENTIAL = {
  '<500': 150,
  '500-1999': 250,
  '2000-9999': 400,
  '10000+': 700
} as const;

// -------------------------------------------------------------
// UPLIFT FACTORS (Mehrbesuche-Modell)
// Based on industry benchmarks for loyalty programs
// -------------------------------------------------------------
export const UPLIFT_FACTORS = {
  // Enrollment rate within 90 days (% of repeat customers who join)
  // Industry benchmark: 20-50% for good loyalty programs
  // Source: Bond Loyalty Report 2023, Antavo Loyalty Statistics
  enrollment90Days: { conservative: 0.20, realistic: 0.35, ambitious: 0.50 },
  
  // Active rate (% of enrolled members who actively participate)
  // Industry benchmark: 40-70% for engaging programs
  // Source: Yotpo, LoyaltyLion Research
  activeRate: { conservative: 0.40, realistic: 0.55, ambitious: 0.70 },
  
  // Frequency lift (% increase in purchase frequency for active members)
  freqLift: { conservative: 0.05, realistic: 0.12, ambitious: 0.20 },
  
  // Extra visits per active member per year
  // Industry benchmark: Active loyalty members visit 2-5x more often
  // Source: Bain & Company, Harvard Business Review
  extraVisitsPerActiveMemberPerYear: { conservative: 2.0, realistic: 3.5, ambitious: 5.0 },
  
  // Basket/Ticket uplift for loyal customers (% more spend per visit)
  // Industry benchmark: Loyal customers spend 12-31% more per transaction
  // Source: Adobe Digital Economy Index, McKinsey Retail Study, Accenture
  basketUplift: { conservative: 0.12, realistic: 0.20, ambitious: 0.31 },
  
  networkLift: {
    'action': { conservative: 0.01, realistic: 0.03, ambitious: 0.06 },
    'listing': { conservative: 0.005, realistic: 0.015, ambitious: 0.03 },
    'unclear': { conservative: 0.002, realistic: 0.008, ambitious: 0.02 }
  },
  ghlConvLift: {
    noFollowUp: { conservative: 0.08, realistic: 0.20, ambitious: 0.35 },
    withFollowUp: { conservative: 0.03, realistic: 0.08, ambitious: 0.15 }
  },
  // Review uplift (as fraction of monthly transactions converted to new visits)
  // Better reviews → more new customers discovering the business
  // Source: BrightLocal Consumer Survey, Spiegel Research Center
  reviewUplift: {
    conservative: 0.01,  // 1% of monthly transactions
    realistic: 0.025,    // 2.5% of monthly transactions  
    ambitious: 0.05      // 5% of monthly transactions
  }
} as const;

// -------------------------------------------------------------
// REVIEW MANAGEMENT OPTIONS
// -------------------------------------------------------------
export const REVIEW_COUNT_OPTIONS = [
  { value: '0-19' as const, label: '0–19 Bewertungen' },
  { value: '20-49' as const, label: '20–49 Bewertungen' },
  { value: '50-199' as const, label: '50–199 Bewertungen' },
  { value: '200+' as const, label: '200+ Bewertungen' },
  { value: 'unknown' as const, label: 'Weiss nicht' }
] as const;

export const REVIEW_RATING_OPTIONS = [
  { value: '<4.2' as const, label: 'Unter 4.2 ⭐' },
  { value: '4.2-4.5' as const, label: '4.2 – 4.5 ⭐' },
  { value: '4.6-4.8' as const, label: '4.6 – 4.8 ⭐' },
  { value: '4.9+' as const, label: '4.9+ ⭐' },
  { value: 'unknown' as const, label: 'Weiss nicht' }
] as const;

export const REVIEW_PROCESS_OPTIONS = [
  { value: 'never' as const, label: 'Fragen nie aktiv nach Reviews', desc: 'Passiv – warten auf spontane Bewertungen' },
  { value: 'sometimes' as const, label: 'Manchmal, nicht systematisch', desc: 'Ab und zu, wenn wir daran denken' },
  { value: 'systematic' as const, label: 'Systematisch nach jedem Besuch', desc: 'Automatisiert oder konsequent manuell' }
] as const;

export type ReviewCount = typeof REVIEW_COUNT_OPTIONS[number]['value'];
export type ReviewRating = typeof REVIEW_RATING_OPTIONS[number]['value'];
export type ReviewProcess = typeof REVIEW_PROCESS_OPTIONS[number]['value'];

// -------------------------------------------------------------
// SPONSOR CATEGORIES
// -------------------------------------------------------------
export const SPONSOR_CATEGORIES = [
  'Getränke & Food-Lieferanten',
  'Bank / Versicherung / Vorsorge',
  'Mobilität & Garage / Parkhaus',
  'Immobilien / Vermieter / Verwaltung / Center-Management',
  'Freizeit / Destinationen',
  'Energie / Haustechnik',
  'Telekom / IT',
  'Treuhand / Beratung / Recht'
] as const;

export const SPONSOR_SLOTS = [
  'Screen/Display',
  'Tischsteller/Counter',
  'Bon/Beleg',
  'Schaufenster/Plakat',
  'Social (IG/FB/WhatsApp)',
  'Newsletter/E-Mail',
  'Take-away/Packaging/Sticker'
] as const;

// -------------------------------------------------------------
// PROCESS MATURITY CHECKBOXES
// -------------------------------------------------------------
export const PROCESS_MATURITY_ITEMS = [
  { key: 'hasCRM', label: 'Kundenliste/CRM vorhanden' },
  { key: 'requestsReviews', label: 'Reviews aktiv anfragen' },
  { key: 'followsUpLeads', label: 'Offerten/Anfragen werden nachgefasst' },
  { key: 'capturesCustomers', label: 'Kundenerfassung am Checkout möglich' },
  { key: 'canRedeem', label: 'Einlösen operativ sauber machbar' }
] as const;

// -------------------------------------------------------------
// FIXCOST ITEMS
// -------------------------------------------------------------
export const FIXCOST_ITEMS = [
  { key: 'telco', label: 'Telco/Internet', unit: 'pro Monat', ranges: ['0-79', '80-149', '150+'], midpoints: [40, 115, 200] },
  { key: 'software', label: 'Software/Abos', unit: 'pro Monat', ranges: ['0-149', '150-399', '400+'], midpoints: [75, 275, 500] },
  { key: 'treuhand', label: 'Treuhand (Buchhaltung)', unit: 'pro Jahr', ranges: ['0-3\'600', '3\'600-8\'400', '8\'400+'], midpoints: [150, 500, 900], annualToMonthly: true },
  { key: 'insurance', label: 'Versicherungen (alle)', unit: 'pro Jahr', ranges: ['0-2\'400', '2\'400-6\'000', '6\'000+'], midpoints: [100, 350, 650], annualToMonthly: true, multipleAllowed: true },
  { key: 'mobility', label: 'Fahrzeuge/Mobilität', unit: 'pro Monat', ranges: ['0-199', '200-499', '500+'], midpoints: [100, 350, 650] },
  { key: 'bank', label: 'Bank/Fees/Payment', unit: 'pro Monat', ranges: ['0-49', '50-199', '200+'], midpoints: [25, 125, 300] },
  { key: 'rent', label: 'Miete/NK', unit: 'pro Monat', ranges: ['<1200', '1200-2499', '2500+'], midpoints: [800, 1850, 3500] },
  { key: 'web', label: 'Web/Domain/Hosting', unit: 'pro Jahr', ranges: ['0-250', '250-700', '700-1\'800', '1\'800+'], midpoints: [10, 40, 105, 200], annualToMonthly: true }
] as const;

// -------------------------------------------------------------
// ENERGY QUICKWINS
// -------------------------------------------------------------
export const ENERGY_QUICKWINS = [
  'Tarif/Grundpreis prüfen',
  'Nebenkostenpositionen plausibilisieren',
  'LED/Bewegungsmelder installieren',
  'Standby-Verbrauch reduzieren',
  'Heiz-/Kühlzeiten optimieren',
  'Lastspitzen vermeiden',
  'Filter/Anlagen regelmässig warten'
] as const;

// -------------------------------------------------------------
// DB% Options for Mini Price Lever
// -------------------------------------------------------------
export const DB_OPTIONS = [
  { label: 'Niedrig (30%)', value: 0.30 },
  { label: 'Mittel (50%)', value: 0.50 },
  { label: 'Hoch (75%)', value: 0.75 },
  { label: 'Weiss nicht', value: 0.50 }
] as const;

// -------------------------------------------------------------
// ROLE CONFIGURATION (NEW)
// -------------------------------------------------------------
export const ROLE_OPTIONS = [
  { value: 'owner' as const, label: 'Inhaber:in / Geschäftsführung' },
  { value: 'finance' as const, label: 'Finanzen (CFO/Buchhaltung/Treuhand)' },
  { value: 'marketing' as const, label: 'Marketing/Vertrieb' },
  { value: 'operations' as const, label: 'Filialleitung / Operations' },
  { value: 'other' as const, label: 'Sonstiges' }
] as const;

export const EMPLOYEE_OPTIONS = [
  { value: '1-3' as const, label: '1–3' },
  { value: '4-10' as const, label: '4–10' },
  { value: '11-30' as const, label: '11–30' },
  { value: '31+' as const, label: '31+' }
] as const;

export const ROLE_HINTS: Record<string, string> = {
  finance: 'Wir fokussieren Refinanzierung & Verträge. Uplift ist optionaler Bonus.',
  marketing: 'Wir fokussieren Uplift, Aktivierung und Automationen (ab Plus).',
  operations: 'Sie müssen nicht alles wissen – wir fokussieren Alltag & Nutzen. Fehlende Zahlen können Sie später an Finanzen weitergeben.'
};

// Step gating per role: which steps are required/optional
export const ROLE_STEP_GATING: Record<string, { step1: 'required' | 'optional'; step2: 'required' | 'optional'; step3: 'required' | 'optional'; sponsoring: 'required' | 'optional' }> = {
  owner: { step1: 'required', step2: 'required', step3: 'optional', sponsoring: 'optional' },
  finance: { step1: 'required', step2: 'required', step3: 'optional', sponsoring: 'optional' },
  marketing: { step1: 'required', step2: 'optional', step3: 'required', sponsoring: 'optional' },
  operations: { step1: 'required', step2: 'optional', step3: 'optional', sponsoring: 'required' },
  other: { step1: 'required', step2: 'optional', step3: 'optional', sponsoring: 'optional' }
};

// -------------------------------------------------------------
// MISSING INFO ITEMS
// -------------------------------------------------------------
export const MISSING_INFO_ITEMS = {
  treuhand: { label: 'Treuhandkosten (Range)', forRole: 'finance' },
  bank: { label: 'Bank/Fees/Payment Kosten (Range)', forRole: 'finance' },
  rent: { label: 'Miete/Nebenkosten (Range) + ob Verhandlung möglich', forRole: 'finance' },
  web: { label: 'Web/Hosting Kosten (Range) + Domain', forRole: 'finance' },
  energy: { label: 'Ob Strom über NK läuft und ob eigener Vertrag', forRole: 'finance' },
  leads: { label: 'Leads/Monat (für Uplift-Berechnung)', forRole: 'marketing' },
  conversion: { label: 'Aktuelle Lead→Sale Conversion (für Uplift)', forRole: 'marketing' },
  transactions: { label: 'Transaktionen/Termine pro Monat', forRole: 'operations' },
  avgTicket: { label: 'Durchschnittlicher Bon/Auftragswert', forRole: 'operations' },
  contract: { label: 'Kündigungsfrist / Vertragsnr (optional)', forRole: 'finance' }
} as const;

// -------------------------------------------------------------
// TEXTS / I18N
// -------------------------------------------------------------
export const TEXTS = {
  stepTitles: {
    1: 'Passt My2Go zu Ihnen?',
    2: 'Uplift berechnen',
    3: 'Risikolos finanzieren',
    final: 'Ihre Empfehlung'
  },
  fitLabels: {
    A: { title: 'Ideal Fit', color: 'text-green-600', bgColor: 'bg-green-100' },
    B: { title: 'Guter Fit', color: 'text-amber-600', bgColor: 'bg-amber-100' },
    C: { title: 'Bedingt geeignet', color: 'text-red-600', bgColor: 'bg-red-100' }
  },
  disclaimer: 'Konservative Schätzung. Keine Garantie. Keine Rechts-/Steuerberatung. Kündigungsfristen und Vertragsdetails bitte prüfen.',
  upliftNote: 'Uplift ist Bonus; Refinanzierung basiert auf konservativen Hebeln.',
  sizeBanner: 'Bei Ihrer Grösse ist CHF 300/Monat weniger entscheidend als Uplift in % + Rolloutfähigkeit. Wir zeigen beides.',
  operationsBanner: 'Sie müssen nicht alle Zahlen kennen. Nutzen/Alltag zuerst – Finanzen kann fehlende Werte ergänzen.'
} as const;

// -------------------------------------------------------------
// EMAIL TEMPLATES
// -------------------------------------------------------------
export const EMAIL_TEMPLATES = {
  konditionenAnfragen: {
    subject: 'Anfrage Konditionen / Vertragsprüfung – {firma}',
    body: `Sehr geehrte Damen und Herren

Wir prüfen aktuell unsere Fixkosten und möchten die Konditionen für {produkt} überprüfen.

Bitte senden Sie uns bis {datum} eine Übersicht der Leistungen inkl. Preise sowie eine optimierte Offerte (gleichwertig oder besser).

Eckdaten:
{eckdaten}

Gerne auch 2 Terminvorschläge.

Freundliche Grüsse

{kontaktperson}
{firma}
{adresse}
{telefon}
{email}

Kundennr/Vertragsnr: {vertragsnr}`
  },
  kuendigung: {
    subject: 'Kündigung Vertrag {produkt} per {datum} – {firma}',
    body: `Sehr geehrte Damen und Herren

Hiermit kündigen wir den Vertrag {produkt} (Vertragsnr: {vertragsnr}) ordentlich und fristgerecht per {datum}.

Bitte bestätigen Sie uns das Vertragsende schriftlich und teilen Sie den Ablauf für die Übergabe/Deaktivierung mit.

Freundliche Grüsse

{kontaktperson}
{firma}
{adresse}
{telefon}
{email}`
  },
  preisnachlass: {
    subject: 'Gesprächsanfrage Konditionen – {firma} / {objekt}',
    body: `Guten Tag

Wir möchten die Konditionen {typ} für das Jahr {jahr} besprechen.

Ziel: fairer Abgleich der Leistungen/Abrechnung und Anpassung an die aktuelle Nutzung.

Können Sie uns bitte eine kurze Übersicht der Kostenpositionen und den Verteilschlüssel senden und 2 Terminvorschläge machen?

Freundliche Grüsse

{kontaktperson}
{firma}
{adresse}
{telefon}
{email}`
  },
  sponsoring: {
    subject: 'Lokales Sponsoring: Präsenzpakete ab CHF {paketpreis}/Monat – {firma}',
    body: `Guten Tag

Wir bauen unser lokales My2Go Bonus-/Gutscheinprogramm aus und bieten Sponsoring-Präsenzpakete an.

Leistungen: {sponsorflaechen} + optional "Deal präsentiert von [Sponsor]" im Partnernetzwerk.

Pakete:
- S (CHF 100–250): Basis-Präsenz
- M (CHF 250–500): Erweiterte Sichtbarkeit
- L (CHF 500–1000): Premium-Paket mit Reporting

Transparent, ohne Lead-/Umsatzgarantie, inkl. Monatsübersicht (Reichweite/Einlösungen).

Interessiert? Gerne sende ich Details und 2 Terminvorschläge.

Freundliche Grüsse

{kontaktperson}
{firma}
{adresse}
{telefon}
{email}`
  },
  standortpatenschaft: {
    subject: 'Standort-Patenschaft / Mieter-Aktivierung im {objekt} – My2Go',
    body: `Guten Tag

Als Mieter im {objekt} möchten wir Frequenz & Aktivierung mit einer einfachen Massnahme stärken: My2Go Standort-Patenschaft.

Leistungen: "presented by [Vermieter]" auf lokalen Deals + Vor-Ort-Flächen ({sponsorflaechen}) + Monatsübersicht.

Budget ab CHF {budget}/Monat. 10 Minuten Vorstellung?

Freundliche Grüsse

{kontaktperson}
{firma}
{adresse}
{telefon}
{email}`
  }
} as const;

// -------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------
export function getMidpoint(range: string, type: keyof typeof RANGE_MIDPOINTS): number {
  const midpoints = RANGE_MIDPOINTS[type];
  return (midpoints as Record<string, number>)[range] ?? 0;
}

export function formatCHF(amount: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount));
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('de-CH', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}
