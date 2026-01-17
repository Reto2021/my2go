// =============================================================
// MY2GO PARTNER FIT QUIZ - CALCULATIONS
// =============================================================

import {
  QUIZ_PLANS,
  FIXCOST_SAVINGS,
  TIME_SAVINGS,
  SPONSORING_POTENTIAL,
  UPLIFT_FACTORS,
  RANGE_MIDPOINTS,
  FIXCOST_ITEMS,
  PlanKey,
  getMidpoint
} from './partner-quiz-config';

// -------------------------------------------------------------
// TYPES
// -------------------------------------------------------------
export interface QuizAnswers {
  // Step 1: Fit
  businessType: 'walk-in' | 'termin' | 'mischform' | 'b2b' | null;
  transactionsPerMonth: string | null;
  avgTicket: string | null;
  loyaltyShare: string | null;
  incentivePossible: 'easy' | 'selten' | 'schwierig' | null;
  locations: '1' | '2-3' | '4+' | null;

  // Step 2: Fixkosten
  fixcosts: Record<string, { selected: boolean; range: string | null; midpoint: number }>;
  processMaturity: Record<string, boolean>;
  
  // Energy sub-questions
  energyViaNebenkosten: boolean | null;
  hasOwnEnergyContract: boolean | null;
  yearlyConsumption: string | null;
  
  // Web/Hosting extras
  unknownHoster: boolean;
  emailViaHoster: boolean;
  
  // Sponsoring
  openToSponsoring: 'yes-contacts' | 'yes-nocontacts' | 'no' | null;
  sponsorCategories: string[];
  sponsorSlots: string[];
  contactsPerMonth: string | null;
  
  // Rent negotiation
  rentNegotiationPossible: boolean;

  // Step 3: Uplift
  leadsPerMonth: string | null;
  consistentFollowUp: boolean | null;
  conversionRate: string | null;
  partnerCommitment: 'action' | 'listing' | 'unclear' | null;
  
  // Company data
  companyName: string;
  companyAddress: string;
  companyPostalCode: string;
  companyCity: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  contractNumbers: Record<string, string>;
}

export interface FitResult {
  score: 'A' | 'B' | 'C';
  recommendedPlan: PlanKey;
  modules: string[];
  setupHints: string[];
}

export interface RefinancingResult {
  fixcostSavings: number;
  fixcostBreakdown: { lever: string; amount: number; label: string }[];
  timeSavings: number;
  timeHours: number;
  sponsoringSavings: number;
  totalSavings: number;
  gap: number;
  miniPriceLever: {
    requiredExtraRevenue: number;
    priceIncreasePerSale: number;
    percentOfBaseline: number;
  } | null;
}

export interface UpliftResult {
  loyaltyUplift: { conservative: number; realistic: number; ambitious: number };
  networkUplift: { conservative: number; realistic: number; ambitious: number };
  ghlUplift: { conservative: number; realistic: number; ambitious: number };
  total: { conservative: number; realistic: number; ambitious: number };
  baselineRevenue: number;
}

// -------------------------------------------------------------
// FIT SCORING
// -------------------------------------------------------------
export function calculateFitScore(answers: QuizAnswers): FitResult {
  const transactions = getMidpoint(answers.transactionsPerMonth || '<30', 'transactions');
  const loyaltyPct = getMidpoint(answers.loyaltyShare || '<20%', 'loyalty');
  const incentive = answers.incentivePossible;
  const canRedeem = answers.processMaturity.canRedeem ?? false;
  const locations = answers.locations;

  // Count false maturity toggles
  const maturityFalseCount = Object.values(answers.processMaturity).filter(v => !v).length;

  let score: 'A' | 'B' | 'C';

  // A (Ideal)
  if (
    (transactions >= 80 || loyaltyPct >= 40) &&
    incentive !== 'schwierig' &&
    canRedeem
  ) {
    score = 'A';
  }
  // C (Bedingt)
  else if (
    transactions < 30 &&
    incentive === 'schwierig' &&
    maturityFalseCount >= 3
  ) {
    score = 'C';
  }
  // B (Gut)
  else {
    score = 'B';
  }

  // Plan recommendation
  let recommendedPlan: PlanKey;
  if (locations === '4+') {
    recommendedPlan = 'pro';
  } else if (transactions >= 80 || maturityFalseCount >= 3) {
    recommendedPlan = 'plus';
  } else {
    recommendedPlan = 'start';
  }

  // Module recommendation
  const modules: string[] = ['loyalty'];
  if (answers.businessType === 'termin') {
    modules.push('automation');
  } else if (!answers.processMaturity.requestsReviews) {
    modules.push('reviews');
  } else {
    modules.push('deals');
  }

  // Setup hints
  const setupHints: string[] = [];
  if (!answers.processMaturity.hasCRM) {
    setupHints.push('CRM-Setup empfohlen für bessere Segmentierung');
  }
  if (!answers.processMaturity.capturesCustomers) {
    setupHints.push('Kundenerfassung am POS einrichten');
  }

  return { score, recommendedPlan, modules, setupHints };
}

// -------------------------------------------------------------
// REFINANCING CALCULATION
// -------------------------------------------------------------
export function calculateRefinancing(
  answers: QuizAnswers,
  planPrice: number,
  dbPercent: number = 0.5
): RefinancingResult {
  const breakdown: { lever: string; amount: number; label: string }[] = [];
  let totalFixcostSavings = 0;

  // Calculate baseline revenue
  const transactionsMid = getMidpoint(answers.transactionsPerMonth || '<30', 'transactions');
  const avgTicketMid = getMidpoint(answers.avgTicket || '<30', 'avgTicket');
  const baselineRevenue = transactionsMid * avgTicketMid;

  // Fixcost savings
  FIXCOST_ITEMS.forEach(item => {
    const fixcost = answers.fixcosts[item.key];
    if (!fixcost?.selected || !fixcost.range) return;

    const midpoint = fixcost.midpoint || 0;
    const config = FIXCOST_SAVINGS[item.key as keyof typeof FIXCOST_SAVINGS];
    
    if (!config) return;

    if ('ranges' in config) {
      // Web hosting with multiple ranges
      const range = config.ranges.find(r => midpoint >= r.min && midpoint <= r.max);
      if (range) {
        const savings = midpoint * range.savingsPct;
        totalFixcostSavings += savings;
        breakdown.push({ lever: item.key, amount: savings, label: item.label });
      }
    } else if ('threshold' in config) {
      // Standard lever
      if (midpoint >= config.threshold) {
        // Special case: rent requires negotiation flag
        if (item.key === 'rent' && !answers.rentNegotiationPossible) {
          return;
        }
        const savings = midpoint * config.savingsPct;
        totalFixcostSavings += savings;
        breakdown.push({ lever: item.key, amount: savings, label: item.label });
      }
    }
  });

  // Time savings
  const maturityFalseCount = Object.values(answers.processMaturity).filter(v => !v).length;
  let timeHours = 0;
  if (maturityFalseCount >= 4) {
    timeHours = TIME_SAVINGS.hoursFor4Gaps;
  } else if (maturityFalseCount >= 2) {
    timeHours = TIME_SAVINGS.hoursFor2Gaps;
  }
  const timeSavings = timeHours * TIME_SAVINGS.hourlyRate;

  // Sponsoring savings
  let sponsoringSavings = 0;
  if (answers.openToSponsoring && answers.openToSponsoring !== 'no' && answers.contactsPerMonth) {
    const potential = SPONSORING_POTENTIAL[answers.contactsPerMonth as keyof typeof SPONSORING_POTENTIAL] || 0;
    sponsoringSavings = Math.min(potential, planPrice);
  }

  const totalSavings = totalFixcostSavings + timeSavings + sponsoringSavings;
  const gap = Math.max(0, planPrice - totalSavings);

  // Mini price lever
  let miniPriceLever = null;
  if (gap > 0 && dbPercent > 0) {
    const requiredExtraRevenue = gap / dbPercent;
    const priceIncreasePerSale = transactionsMid > 0 ? requiredExtraRevenue / transactionsMid : 0;
    const percentOfBaseline = baselineRevenue > 0 ? requiredExtraRevenue / baselineRevenue : 0;
    miniPriceLever = { requiredExtraRevenue, priceIncreasePerSale, percentOfBaseline };
  }

  return {
    fixcostSavings: totalFixcostSavings,
    fixcostBreakdown: breakdown,
    timeSavings,
    timeHours,
    sponsoringSavings,
    totalSavings,
    gap,
    miniPriceLever
  };
}

// -------------------------------------------------------------
// UPLIFT CALCULATION
// -------------------------------------------------------------
export function calculateUplift(
  answers: QuizAnswers,
  includeGHL: boolean
): UpliftResult {
  // Baseline revenue
  const transactionsMid = getMidpoint(answers.transactionsPerMonth || '<30', 'transactions');
  const avgTicketMid = getMidpoint(answers.avgTicket || '<30', 'avgTicket');
  const baselineRevenue = transactionsMid * avgTicketMid;

  // Loyalty Uplift
  const scenarios = ['conservative', 'realistic', 'ambitious'] as const;
  const loyaltyUplift = { conservative: 0, realistic: 0, ambitious: 0 };
  
  scenarios.forEach(scenario => {
    const enrollment = UPLIFT_FACTORS.enrollment90Days[scenario];
    const activeRate = UPLIFT_FACTORS.activeRate[scenario];
    const freqLift = UPLIFT_FACTORS.freqLift[scenario];
    const activeShare = enrollment * activeRate;
    loyaltyUplift[scenario] = baselineRevenue * activeShare * freqLift;
  });

  // Network Uplift
  const networkUplift = { conservative: 0, realistic: 0, ambitious: 0 };
  const commitment = answers.partnerCommitment || 'unclear';
  const networkFactors = UPLIFT_FACTORS.networkLift[commitment];
  const isB2B = answers.businessType === 'b2b';
  
  scenarios.forEach(scenario => {
    let lift = baselineRevenue * networkFactors[scenario];
    if (isB2B) lift *= 0.5; // 50% reduction for B2B
    networkUplift[scenario] = lift;
  });

  // GHL Uplift (only if plan includes it)
  const ghlUplift = { conservative: 0, realistic: 0, ambitious: 0 };
  
  if (includeGHL) {
    const leadsMid = getMidpoint(answers.leadsPerMonth || '<10', 'leads');
    const convMid = getMidpoint(answers.conversionRate || '<10%', 'conversion') / 100;
    const revenueFromLeads = leadsMid * convMid * avgTicketMid;
    
    const hasFollowUp = answers.consistentFollowUp === true;
    const convFactors = hasFollowUp 
      ? UPLIFT_FACTORS.ghlConvLift.withFollowUp 
      : UPLIFT_FACTORS.ghlConvLift.noFollowUp;
    
    scenarios.forEach(scenario => {
      ghlUplift[scenario] = revenueFromLeads * convFactors[scenario];
    });
  }

  // Total
  const total = { conservative: 0, realistic: 0, ambitious: 0 };
  scenarios.forEach(scenario => {
    total[scenario] = loyaltyUplift[scenario] + networkUplift[scenario] + ghlUplift[scenario];
  });

  return {
    loyaltyUplift,
    networkUplift,
    ghlUplift,
    total,
    baselineRevenue
  };
}

// -------------------------------------------------------------
// ENERGY LOGIC
// -------------------------------------------------------------
export function getEnergyRecommendation(answers: QuizAnswers): {
  showSupplierSwitch: boolean;
  showQuickwins: boolean;
  message: string;
} {
  if (answers.energyViaNebenkosten || !answers.hasOwnEnergyContract) {
    return {
      showSupplierSwitch: false,
      showQuickwins: true,
      message: 'Bei Nebenkosten: Benchmark prüfen + Energie-Quickwins umsetzen'
    };
  }

  if (answers.hasOwnEnergyContract && answers.yearlyConsumption === '>=100000') {
    return {
      showSupplierSwitch: true,
      showQuickwins: true,
      message: 'Bei >100\'000 kWh/Jahr lohnt sich eine Beschaffungsprüfung'
    };
  }

  return {
    showSupplierSwitch: false,
    showQuickwins: true,
    message: 'kWh-Verbrauch auf Rechnung nachsehen für genauere Einschätzung'
  };
}

// -------------------------------------------------------------
// GET PLAN BY KEY
// -------------------------------------------------------------
export function getPlanByKey(key: PlanKey) {
  return QUIZ_PLANS.find(p => p.key === key) || QUIZ_PLANS[0];
}
