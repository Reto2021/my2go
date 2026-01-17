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
  getMidpoint,
  ReviewCount,
  ReviewRating,
  ReviewProcess
} from './partner-quiz-config';

// -------------------------------------------------------------
// TYPES
// -------------------------------------------------------------
// Role types
export type UserRole = 'owner' | 'finance' | 'marketing' | 'operations' | 'other' | null;
export type EmployeeRange = '1-3' | '4-10' | '11-30' | '31+' | null;

export interface QuizAnswers {
  // Step 0: Role & Size (NEW)
  userRole: UserRole;
  userRoleOther?: string; // Free text when role is "other"
  employees: EmployeeRange;
  
  // Step 1: Fit
  businessType: 'walk-in' | 'termin' | 'mischform' | 'b2b' | null;
  transactionsPerMonth: string | null;
  avgTicket: string | null;
  loyaltyShare: string | null;
  incentivePossible: 'easy' | 'selten' | 'schwierig' | null;
  locations: '1' | '2-3' | '4+' | null;

  // Step 2: Fixkosten
  fixcosts: Record<string, { selected: boolean; range: string | null; midpoint: number; unknown?: boolean }>;
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
  
  // Unknown flags for uplift
  unknownLeads?: boolean;
  unknownConversion?: boolean;
  
  // NEW: Review Management
  reviewCount: ReviewCount | null;
  reviewRating: ReviewRating | null;
  reviewProcess: ReviewProcess | null;
  
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
  recommendReviewBooster: boolean;
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

// NEW: Mehrbesuche-based uplift result
export interface MehrbesucheResult {
  extraVisitsPerMonth: { conservative: number; realistic: number; ambitious: number };
  extraVisitsPerYear: { conservative: number; realistic: number; ambitious: number };
  reviewVisitsPerMonth: { conservative: number; realistic: number; ambitious: number };
  totalVisitsPerMonth: { conservative: number; realistic: number; ambitious: number };
  totalVisitsPerYear: { conservative: number; realistic: number; ambitious: number };
  // Optional CHF estimates
  upliftCHFPerMonth: { conservative: number; realistic: number; ambitious: number };
  // Assumptions for display
  assumptions: {
    transactionsPerMonth: number;
    avgBasket: number;
    repeatShare: number;
    enrollmentRate: string;
    activeRate: string;
    hasReviewGap: boolean;
  };
}

export interface UpliftResult {
  loyaltyUplift: { conservative: number; realistic: number; ambitious: number };
  networkUplift: { conservative: number; realistic: number; ambitious: number };
  ghlUplift: { conservative: number; realistic: number; ambitious: number };
  total: { conservative: number; realistic: number; ambitious: number };
  baselineRevenue: number;
  // NEW: Mehrbesuche model
  mehrbesuche: MehrbesucheResult;
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

  // NEW: Review Booster recommendation
  const hasReviewGap = 
    answers.reviewProcess !== 'systematic' || 
    answers.reviewCount === '0-19' || 
    answers.reviewCount === '20-49' ||
    answers.reviewRating === '<4.2';
  
  const recommendReviewBooster = hasReviewGap;

  return { score, recommendedPlan, modules, setupHints, recommendReviewBooster };
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
// UPLIFT CALCULATION (Legacy CHF-based + NEW Mehrbesuche model)
// -------------------------------------------------------------
export function calculateUplift(
  answers: QuizAnswers,
  includeGHL: boolean
): UpliftResult {
  // Baseline values
  const transactionsMid = getMidpoint(answers.transactionsPerMonth || '<30', 'transactions');
  const avgTicketMid = getMidpoint(answers.avgTicket || '<30', 'avgTicket');
  const loyaltyShareMid = getMidpoint(answers.loyaltyShare || '<20%', 'loyalty') / 100;
  const baselineRevenue = transactionsMid * avgTicketMid;

  const scenarios = ['conservative', 'realistic', 'ambitious'] as const;
  
  // =====================================================
  // NEW: MEHRBESUCHE MODEL (12-month visit projection)
  // =====================================================
  
  // Inputs:
  // T = transactions per month (midpoint from Q2)
  // B = avg basket (midpoint from Q3)
  // S = repeat customer share (midpoint from Q4 - loyaltyShare)
  // ActiveShare = Enrollment * ActiveRate
  
  const T = transactionsMid;
  const B = avgTicketMid;
  const S = loyaltyShareMid;
  
  // repeat_tx_per_month = T * S
  const repeatTxPerMonth = T * S;
  
  // Check for review gap
  const hasReviewGap = 
    answers.reviewProcess !== 'systematic' || 
    answers.reviewCount === '0-19' || 
    answers.reviewCount === '20-49' ||
    answers.reviewRating === '<4.2';
  
  const extraVisitsPerMonth = { conservative: 0, realistic: 0, ambitious: 0 };
  const extraVisitsPerYear = { conservative: 0, realistic: 0, ambitious: 0 };
  const reviewVisitsPerMonth = { conservative: 0, realistic: 0, ambitious: 0 };
  const totalVisitsPerMonth = { conservative: 0, realistic: 0, ambitious: 0 };
  const totalVisitsPerYear = { conservative: 0, realistic: 0, ambitious: 0 };
  const upliftCHFPerMonth = { conservative: 0, realistic: 0, ambitious: 0 };
  
  scenarios.forEach(scenario => {
    const enrollment = UPLIFT_FACTORS.enrollment90Days[scenario];
    const activeRate = UPLIFT_FACTORS.activeRate[scenario];
    const activeShare = enrollment * activeRate;
    const extraVisitsPerActiveMemberPerYear = UPLIFT_FACTORS.extraVisitsPerActiveMemberPerYear[scenario];
    
    // active_repeat_tx_per_month = repeat_tx_per_month * ActiveShare
    const activeRepeatTxPerMonth = repeatTxPerMonth * activeShare;
    
    // extra_visits_per_month = active_repeat_tx_per_month * (extraVisitsPerActiveMemberPerYear / 12)
    const extraVisits = activeRepeatTxPerMonth * (extraVisitsPerActiveMemberPerYear / 12);
    extraVisitsPerMonth[scenario] = extraVisits;
    extraVisitsPerYear[scenario] = extraVisits * 12;
    
    // Review uplift (if gap detected)
    if (hasReviewGap) {
      const reviewLift = T * UPLIFT_FACTORS.reviewUplift[scenario];
      reviewVisitsPerMonth[scenario] = reviewLift;
    }
    
    // Totals
    totalVisitsPerMonth[scenario] = extraVisitsPerMonth[scenario] + reviewVisitsPerMonth[scenario];
    totalVisitsPerYear[scenario] = totalVisitsPerMonth[scenario] * 12;
    
    // Optional CHF estimate
    upliftCHFPerMonth[scenario] = totalVisitsPerMonth[scenario] * B;
  });
  
  const mehrbesuche: MehrbesucheResult = {
    extraVisitsPerMonth,
    extraVisitsPerYear,
    reviewVisitsPerMonth,
    totalVisitsPerMonth,
    totalVisitsPerYear,
    upliftCHFPerMonth,
    assumptions: {
      transactionsPerMonth: T,
      avgBasket: B,
      repeatShare: S,
      enrollmentRate: `${Math.round(UPLIFT_FACTORS.enrollment90Days.realistic * 100)}%`,
      activeRate: `${Math.round(UPLIFT_FACTORS.activeRate.realistic * 100)}%`,
      hasReviewGap
    }
  };
  
  // =====================================================
  // LEGACY: CHF-based Uplift (kept for backward compat)
  // =====================================================
  
  // Loyalty Uplift
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

  // Total (legacy CHF)
  const total = { conservative: 0, realistic: 0, ambitious: 0 };
  scenarios.forEach(scenario => {
    total[scenario] = loyaltyUplift[scenario] + networkUplift[scenario] + ghlUplift[scenario];
  });

  return {
    loyaltyUplift,
    networkUplift,
    ghlUplift,
    total,
    baselineRevenue,
    mehrbesuche
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
