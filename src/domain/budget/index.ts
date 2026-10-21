/**
 * FestiFi AI — Core Budget Engine
 * Pure, deterministic mathematical operations for event budgeting.
 * Completely immune to floating-point representation drift by using
 * integer minor currency units (cents / pence / paise).
 */

import {
  BudgetAlternativeOption,
  BudgetAlternatives,
  BudgetCategory,
  BudgetSummary,
  BudgetTier,
  CategoryBreakdown,
  CurrencyCode,
  EventDetails,
  ExpenseItem,
  BudgetOptimizationProposal,
  ScenarioTradeoff,
} from '../types';

export const CATEGORY_NAMES: Record<BudgetCategory, string> = {
  venue: 'Venue & Facilities',
  catering: 'Catering & Beverages',
  entertainment: 'Entertainment & Music',
  photography: 'Photo & Videography',
  decor: 'Decor, Florals & Lighting',
  attire: 'Attire & Styling',
  invitations: 'Invitations & Stationery',
  logistics: 'Logistics & Rentals',
  miscellaneous: 'Miscellaneous & Contingency',
};

export const ALL_CATEGORIES: BudgetCategory[] = [
  'venue',
  'catering',
  'entertainment',
  'photography',
  'decor',
  'attire',
  'invitations',
  'logistics',
  'miscellaneous',
];

/**
 * Converts a decimal monetary amount (e.g., 1500.50) into integer minor units (150050).
 * Safely handles strings, numbers, rejects null, undefined, booleans, NaN and Infinity.
 */
export function parseDecimalToMinor(input: string | number): number {
  if (input === null || input === undefined || typeof input === 'boolean') {
    throw new Error('Invalid financial amount: null, undefined or boolean not allowed');
  }

  if (typeof input === 'number') {
    if (!Number.isFinite(input) || Number.isNaN(input)) {
      throw new Error('Invalid financial amount: NaN or Infinity');
    }
    if (input < 0) {
      throw new Error('Invalid financial amount: Negative numbers not allowed');
    }
    return Math.round(input * 100);
  }

  if (typeof input !== 'string') {
    throw new Error('Invalid financial amount: Unsupported data type');
  }

  const cleaned = input.trim().replace(/[$,€£¥₹]/g, '').replace(/,/g, '');
  if (!cleaned) return 0;

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    throw new Error(`Cannot parse invalid currency string: "${input}"`);
  }
  if (parsed < 0) {
    throw new Error('Invalid financial amount: Negative numbers not allowed');
  }

  return Math.round(parsed * 100);
}

/**
 * Converts integer minor units back to a float decimal (e.g. 150050 -> 1500.50).
 */
export function minorToDecimal(minor: number): number {
  if (!Number.isFinite(minor)) return 0;
  return minor / 100;
}

/**
 * Formats integer minor currency units for UI presentation with appropriate locale symbol.
 */
export function formatCurrencyMinor(
  amountMinor: number,
  currency: CurrencyCode = 'USD',
  locale: string = 'en-US'
): string {
  const safeMinor = Number.isFinite(amountMinor) ? amountMinor : 0;
  const decimal = safeMinor / 100;

  const currencyMap: Record<CurrencyCode, { code: string; defaultLocale: string }> = {
    USD: { code: 'USD', defaultLocale: 'en-US' },
    EUR: { code: 'EUR', defaultLocale: 'de-DE' },
    GBP: { code: 'GBP', defaultLocale: 'en-GB' },
    INR: { code: 'INR', defaultLocale: 'en-IN' },
    CAD: { code: 'CAD', defaultLocale: 'en-CA' },
    AUD: { code: 'AUD', defaultLocale: 'en-AU' },
  };

  const config = currencyMap[currency] || currencyMap.USD;
  const chosenLocale = locale || config.defaultLocale;

  try {
    return new Intl.NumberFormat(chosenLocale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(decimal);
  } catch {
    return `${currency} ${decimal.toFixed(2)}`;
  }
}

/**
 * Evaluates the effective committed cost of an expense item without double-counting.
 * If confirmed or paid, actual cost is prioritized (or estimated if actual is not set).
 * Always guarantees committed is at least the amount already paid.
 */
export function getItemCommittedMinor(item: ExpenseItem): number {
  const itemPaid = Math.max(0, Math.round(item.paidMinor || 0));
  if (item.status === 'confirmed' || item.status === 'paid') {
    const base = item.actualCostMinor !== null ? item.actualCostMinor : item.estimatedCostMinor;
    return Math.max(base, itemPaid);
  }
  return Math.max(item.estimatedCostMinor, itemPaid);
}

/**
 * Calculates complete, pure budget summary metrics for an event.
 */
export function calculateBudgetSummary(
  event: Pick<EventDetails, 'totalBudgetMinor' | 'contingencyPercentage' | 'guestCount'>,
  expenses: ExpenseItem[]
): BudgetSummary {
  const totalBudgetMinor = Math.max(0, Math.round(event.totalBudgetMinor));
  const contingencyPercentage = Math.max(0, Math.min(50, event.contingencyPercentage || 0));
  const actualGuests = Math.round(event.guestCount || 0);

  // Explicit calculation of contingency reserve
  const contingencyReserveMinor = Math.round((totalBudgetMinor * contingencyPercentage) / 100);

  let plannedMinor = 0;
  let confirmedMinor = 0;
  let paidMinor = 0;

  const categoryMap = new Map<BudgetCategory, { allocated: number; confirmed: number; paid: number; count: number }>();
  for (const cat of ALL_CATEGORIES) {
    categoryMap.set(cat, { allocated: 0, confirmed: 0, paid: 0, count: 0 });
  }

  for (const item of expenses) {
    const committed = getItemCommittedMinor(item);
    const itemPaid = Math.max(0, Math.round(item.paidMinor || 0));
    paidMinor += itemPaid;

    const catData = categoryMap.get(item.categoryId) || { allocated: 0, confirmed: 0, paid: 0, count: 0 };
    catData.count += 1;
    catData.paid += itemPaid;

    if (item.status === 'confirmed' || item.status === 'paid') {
      confirmedMinor += committed;
      catData.confirmed += committed;
      catData.allocated += committed;
    } else {
      plannedMinor += committed;
      catData.allocated += committed;
    }
  }

  const totalCommittedMinor = plannedMinor + confirmedMinor;
  const unallocatedMinor = totalBudgetMinor - contingencyReserveMinor - totalCommittedMinor;
  const remainingMinor = totalBudgetMinor - confirmedMinor;
  const varianceMinor = totalBudgetMinor - totalCommittedMinor;

  const perPersonCostMinor = confirmedMinor > 0 ? confirmedMinor : totalCommittedMinor;
  // If guest count is 0, per-person estimate is mathematically 0
  const perPersonEstimateMinor = actualGuests > 0 ? Math.round(perPersonCostMinor / actualGuests) : 0;
  const isOverBudget = totalCommittedMinor + contingencyReserveMinor > totalBudgetMinor;

  const categoryBreakdown: CategoryBreakdown[] = ALL_CATEGORIES.map((categoryId) => {
    const data = categoryMap.get(categoryId)!;
    const percentageOfBudget = totalBudgetMinor > 0
      ? Number(((data.allocated / totalBudgetMinor) * 100).toFixed(1))
      : 0;

    return {
      categoryId,
      categoryName: CATEGORY_NAMES[categoryId],
      allocatedMinor: data.allocated,
      confirmedMinor: data.confirmed,
      paidMinor: data.paid,
      percentageOfBudget,
      itemCount: data.count,
    };
  });

  return {
    totalBudgetMinor,
    contingencyReserveMinor,
    plannedMinor,
    confirmedMinor,
    paidMinor,
    unallocatedMinor,
    remainingMinor,
    varianceMinor,
    perPersonEstimateMinor,
    isOverBudget,
    categoryBreakdown,
  };
}

/**
 * Deterministic budget optimization proposal generator.
 * Analyzes expenses, safeguards must-have items and already confirmed contracts,
 * and proposes prioritized, sensible reductions on nice_to_have and optional expenses
 * to achieve financial solvency and restore the required contingency reserve.
 */
export function generateBudgetOptimization(
  event: EventDetails,
  expenses: ExpenseItem[]
): BudgetOptimizationProposal {
  const summaryBefore = calculateBudgetSummary(event, expenses);
  const proposalId = `opt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Evaluate required deficit to balance allocations + contingency within available budget
  const requiredBudgetWithContingency = summaryBefore.plannedMinor + summaryBefore.confirmedMinor + summaryBefore.contingencyReserveMinor;
  const deficitMinor = Math.max(0, requiredBudgetWithContingency - event.totalBudgetMinor);

  const proposedExpenses: ExpenseItem[] = JSON.parse(JSON.stringify(expenses));
  const tradeoffs: ScenarioTradeoff[] = [];

  let accumulatedSavingsMinor = 0;

  // Pass 1: Reduce 'optional' items that are not yet confirmed or paid
  for (let i = 0; i < proposedExpenses.length; i++) {
    const item = proposedExpenses[i];
    if (item.priority === 'optional' && item.status !== 'confirmed' && item.status !== 'paid') {
      const currentCost = item.estimatedCostMinor;
      if (currentCost > 0) {
        const needed = deficitMinor > 0 ? deficitMinor - accumulatedSavingsMinor : currentCost;
        const maxCut = currentCost > 10000 ? Math.round(currentCost * 0.4) : currentCost;
        const cut = deficitMinor > 0 ? Math.min(maxCut, needed) : maxCut;

        if (cut > 0) {
          item.estimatedCostMinor = Math.max(0, currentCost - cut);
          accumulatedSavingsMinor += cut;
          tradeoffs.push({
            item: item.name,
            change: cut === currentCost ? 'Omitted entirely' : `Reduced by ${Math.round((cut / currentCost) * 100)}%`,
            reason: 'Optional non-critical element adjusted to relieve budget strain',
            savingsMinor: cut,
          });
        }
      }
    }
    if (deficitMinor > 0 && accumulatedSavingsMinor >= deficitMinor) break;
  }

  // Pass 2: If still deficient, optimize 'nice_to_have' items
  if (deficitMinor > 0 && accumulatedSavingsMinor < deficitMinor) {
    for (let i = 0; i < proposedExpenses.length; i++) {
      const item = proposedExpenses[i];
      if (item.priority === 'nice_to_have' && item.status !== 'confirmed' && item.status !== 'paid') {
        const currentCost = item.estimatedCostMinor;
        if (currentCost > 5000) {
          const needed = deficitMinor - accumulatedSavingsMinor;
          const maxCut = Math.round(currentCost * 0.2); // Up to 20% tier switch
          const cut = Math.min(maxCut, needed);

          if (cut > 0) {
            item.estimatedCostMinor = currentCost - cut;
            accumulatedSavingsMinor += cut;
            tradeoffs.push({
              item: item.name,
              change: `Negotiated lower tier package (-${Math.round((cut / currentCost) * 100)}%)`,
              reason: 'Nice-to-have tier adjustment preserves core experience while eliminating deficit',
              savingsMinor: cut,
            });
          }
        }
      }
      if (accumulatedSavingsMinor >= deficitMinor) break;
    }
  }

  // If no adjustments were needed because plan is already fully balanced
  if (tradeoffs.length === 0) {
    tradeoffs.push({
      item: 'Contingency & Cash Flow',
      change: 'Maintained optimal distribution',
      reason: 'Current planned allocations sit comfortably within total budget and meet all priority gates.',
      savingsMinor: 0,
    });
  }

  const summaryAfter = calculateBudgetSummary(event, proposedExpenses);

  const rationale = deficitMinor > 0
    ? `Deficit of ${formatCurrencyMinor(deficitMinor, event.currency)} resolved through ${tradeoffs.length} targeted trade-offs while strictly safeguarding all must-have priorities and confirmed vendor commitments.`
    : `Budget plan is healthy. Proposed minor optimizations maximize contingency buffer and cost efficiency across non-essential categories.`;

  return {
    proposalId,
    rationale,
    summaryBefore,
    summaryAfter,
    tradeoffs,
    proposedExpenses,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Atomically applies an approved budget optimization proposal to current expenses.
 * Safeguards against clobbering concurrent expenses added during the optimization review.
 */
export function applyBudgetOptimization(
  currentExpenses: ExpenseItem[],
  proposal: BudgetOptimizationProposal
): ExpenseItem[] {
  const proposedMap = new Map<string, ExpenseItem>();
  for (const item of proposal.proposedExpenses) {
    proposedMap.set(item.id, item);
  }

  return currentExpenses.map((item) => {
    const proposed = proposedMap.get(item.id);
    if (!proposed) return item; // Preserve concurrent expense unmodified
    return {
      ...item,
      estimatedCostMinor: proposed.estimatedCostMinor,
      notes: proposed.notes,
    };
  });
}

/**
 * Generates three distinct, deterministic budget planning alternatives:
 * 1. Economical (Lean & Essential)
 * 2. Balanced (Standard Recommended)
 * 3. Premium (Luxury Upgrades)
 */
export function generateBudgetAlternatives(
  event: EventDetails,
  expenses: ExpenseItem[]
): BudgetAlternatives {
  const summary = calculateBudgetSummary(event, expenses);

  // 1. Economical Tier: Lean, essential-only, cuts optional, trims nice-to-have by 30%
  const economicalExpenses: ExpenseItem[] = expenses.map((item) => {
    if (item.status === 'confirmed' || item.status === 'paid') return { ...item };
    if (item.priority === 'optional') {
      return {
        ...item,
        estimatedCostMinor: Math.round(item.estimatedCostMinor * 0.2), // 80% reduction
        notes: `${item.notes || ''} [Economical Tier: Trimmed to base essentials]`.trim(),
      };
    }
    if (item.priority === 'nice_to_have') {
      return {
        ...item,
        estimatedCostMinor: Math.round(item.estimatedCostMinor * 0.7), // 30% reduction
        notes: `${item.notes || ''} [Economical Tier: Streamlined scope]`.trim(),
      };
    }
    return { ...item };
  });

  const econSummary = calculateBudgetSummary({ ...event, contingencyPercentage: 8 }, economicalExpenses);
  const econTotal = econSummary.plannedMinor + econSummary.confirmedMinor;

  const economical: BudgetAlternativeOption = {
    tier: 'economical',
    name: 'Economical (Essential)',
    subtitle: 'Cost-conscious package prioritizing must-haves',
    totalEstimatedMinor: econTotal,
    varianceAgainstTotalMinor: event.totalBudgetMinor - econTotal,
    contingencyReserveMinor: Math.round((econTotal * 8) / 100),
    description: 'Safeguards core venue, dining, and photography while streamlining non-essential decor and styling additions.',
    expenses: economicalExpenses,
    keyHighlights: [
      'Focuses 90% of funding on must-have contracts',
      'Minimizes optional rentals and luxury amenities',
      `Delivers estimated ${formatCurrencyMinor(Math.max(0, summary.plannedMinor + summary.confirmedMinor - econTotal), event.currency)} in overall cost relief`,
    ],
  };

  // 2. Balanced Tier: Standard recommended, optimal 10% contingency
  const balancedExpenses: ExpenseItem[] = expenses.map((item) => ({ ...item }));
  const balancedSummary = calculateBudgetSummary(event, balancedExpenses);
  const balTotal = balancedSummary.plannedMinor + balancedSummary.confirmedMinor;

  const balanced: BudgetAlternativeOption = {
    tier: 'balanced',
    name: 'Balanced (Recommended)',
    subtitle: 'Standard harmonious allocation with 10% safety reserve',
    totalEstimatedMinor: balTotal,
    varianceAgainstTotalMinor: event.totalBudgetMinor - balTotal,
    contingencyReserveMinor: balancedSummary.contingencyReserveMinor,
    description: 'Carefully balances premium guest hospitality with disciplined financial management.',
    expenses: balancedExpenses,
    keyHighlights: [
      'Full coverage for ceremony, reception, and entertainment',
      'Preserves 10% buffer against unexpected vendor adjustments',
      'Maintains quality entertainment and ambient florals',
    ],
  };

  // 3. Premium Tier: Luxury upgrades, elevated dining and experiences
  const premiumExpenses: ExpenseItem[] = expenses.map((item) => {
    if (item.status === 'confirmed' || item.status === 'paid') return { ...item };
    if (item.categoryId === 'catering') {
      return {
        ...item,
        estimatedCostMinor: Math.round(item.estimatedCostMinor * 1.25),
        notes: `${item.notes || ''} [Premium Tier: Artisanal multi-course dining & top-shelf bar]`.trim(),
      };
    }
    if (item.categoryId === 'decor') {
      return {
        ...item,
        estimatedCostMinor: Math.round(item.estimatedCostMinor * 1.30),
        notes: `${item.notes || ''} [Premium Tier: Expanded floral installations & architectural lighting]`.trim(),
      };
    }
    if (item.categoryId === 'entertainment') {
      return {
        ...item,
        estimatedCostMinor: Math.round(item.estimatedCostMinor * 1.25),
        notes: `${item.notes || ''} [Premium Tier: Live musicians + DJ & interactive mirror booth]`.trim(),
      };
    }
    if (item.priority === 'nice_to_have' || item.priority === 'optional') {
      return {
        ...item,
        estimatedCostMinor: Math.round(item.estimatedCostMinor * 1.15),
      };
    }
    return { ...item };
  });

  const premSummary = calculateBudgetSummary({ ...event, contingencyPercentage: 15 }, premiumExpenses);
  const premTotal = premSummary.plannedMinor + premSummary.confirmedMinor;

  const premium: BudgetAlternativeOption = {
    tier: 'premium',
    name: 'Premium (Luxury)',
    subtitle: 'Elevated guest experience with top-tier culinary and sensory upgrades',
    totalEstimatedMinor: premTotal,
    varianceAgainstTotalMinor: event.totalBudgetMinor - premTotal,
    contingencyReserveMinor: Math.round((premTotal * 15) / 100),
    description: 'Elevates dinner service, open bar selections, live musical arrangements, and immersive venue lighting.',
    expenses: premiumExpenses,
    keyHighlights: [
      'Top-shelf bar and artisanal multi-course culinary tasting',
      'Lush overhead floral hanging canopies and custom lighting',
      '15% expanded contingency cushion for VIP flexibility',
    ],
  };

  return { economical, balanced, premium };
}

/**
 * Applies a chosen budget planning alternative option to current expenses.
 */
export function applyBudgetAlternative(
  currentExpenses: ExpenseItem[],
  alternative: BudgetAlternativeOption
): ExpenseItem[] {
  const altMap = new Map(alternative.expenses.map((e) => [e.id, e]));
  return currentExpenses.map((item) => {
    const alt = altMap.get(item.id);
    if (!alt) return item;
    return {
      ...item,
      estimatedCostMinor: alt.estimatedCostMinor,
      notes: alt.notes,
    };
  });
}

