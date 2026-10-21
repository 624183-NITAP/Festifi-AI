import { describe, expect, it } from 'vitest';
import {
  ALL_CATEGORIES,
  applyBudgetAlternative,
  calculateBudgetSummary,
  formatCurrencyMinor,
  generateBudgetAlternatives,
  generateBudgetOptimization,
  minorToDecimal,
  parseDecimalToMinor,
} from '../domain/budget';
import { EventDetails, ExpenseItem } from '../domain/types';

const mockEvent: EventDetails = {
  id: 'ev-advanced-budget',
  title: 'Metropolitan Design Summit',
  type: 'corporate',
  theme: 'Modern Architecture',
  targetDate: '2027-10-15',
  guestCount: 200,
  currency: 'USD',
  totalBudgetMinor: 5000000, // $50,000.00
  contingencyPercentage: 10,  // $5,000.00
  location: 'City Convention Center',
  notes: 'Executive lunch and panel discussions',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

describe('Advanced Budget Engine Edge Cases (Phase 2)', () => {
  describe('Zero Budgets and Zero Parameters', () => {
    it('handles zero total budget without division-by-zero or NaN output', () => {
      const zeroBudgetEvent: EventDetails = {
        ...mockEvent,
        totalBudgetMinor: 0,
        contingencyPercentage: 10,
        guestCount: 150,
      };

      const summary = calculateBudgetSummary(zeroBudgetEvent, []);
      expect(summary.totalBudgetMinor).toBe(0);
      expect(summary.contingencyReserveMinor).toBe(0);
      expect(summary.unallocatedMinor).toBe(0);
      expect(summary.isOverBudget).toBe(false);
      expect(summary.perPersonEstimateMinor).toBe(0);

      // Percentage of budget for categories must be 0, not NaN
      for (const cat of summary.categoryBreakdown) {
        expect(cat.percentageOfBudget).toBe(0);
        expect(Number.isFinite(cat.percentageOfBudget)).toBe(true);
      }
    });

    it('handles zero budget with active expenses, flagging over-budget immediately', () => {
      const zeroBudgetEvent: EventDetails = {
        ...mockEvent,
        totalBudgetMinor: 0,
      };

      const expenses: ExpenseItem[] = [
        {
          id: 'exp-zero-1',
          categoryId: 'venue',
          name: 'Conference Room',
          estimatedCostMinor: 100000,
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'must_have',
        },
      ];

      const summary = calculateBudgetSummary(zeroBudgetEvent, expenses);
      expect(summary.isOverBudget).toBe(true);
      expect(summary.varianceMinor).toBe(-100000);
      expect(summary.unallocatedMinor).toBe(-100000);
    });
  });

  describe('Invalid Financial Amounts & Type Safety', () => {
    it('strictly rejects negative amounts, NaN, Infinity, and malformed inputs', () => {
      expect(() => parseDecimalToMinor(-1)).toThrow(/Negative numbers not allowed/);
      expect(() => parseDecimalToMinor(-0.01)).toThrow(/Negative numbers not allowed/);
      expect(() => parseDecimalToMinor('-50.00')).toThrow(/Negative numbers not allowed/);
      expect(() => parseDecimalToMinor(NaN)).toThrow(/NaN or Infinity/);
      expect(() => parseDecimalToMinor(Infinity)).toThrow(/NaN or Infinity/);
      expect(() => parseDecimalToMinor(-Infinity)).toThrow();
      expect(() => parseDecimalToMinor('invalid_text')).toThrow(/Cannot parse invalid currency string/);
      expect(() => parseDecimalToMinor(null as unknown as number)).toThrow();
      expect(() => parseDecimalToMinor(undefined as unknown as number)).toThrow();
      expect(() => parseDecimalToMinor(true as unknown as number)).toThrow();
      expect(() => parseDecimalToMinor(false as unknown as number)).toThrow();
      expect(() => parseDecimalToMinor({} as unknown as number)).toThrow();
    });

    it('cleanly sanitizes currency symbols, commas, and whitespace', () => {
      expect(parseDecimalToMinor('$1,234.56')).toBe(123456);
      expect(parseDecimalToMinor(' € 500.00 ')).toBe(50000);
      expect(parseDecimalToMinor('£2,500,000.00')).toBe(250000000);
      expect(parseDecimalToMinor('₹99.99')).toBe(9999);
      expect(parseDecimalToMinor('   ')).toBe(0);
    });
  });

  describe('Rounding Precision & IEEE 754 Drift Immunity', () => {
    it('accurately rounds fractional cents to nearest integer minor unit', () => {
      // 10.004 -> 1000 minor ($10.00)
      expect(parseDecimalToMinor(10.004)).toBe(1000);
      // 10.005 -> 1001 minor ($10.01)
      expect(parseDecimalToMinor(10.005)).toBe(1001);
      // 19.999 -> 2000 minor ($20.00)
      expect(parseDecimalToMinor(19.999)).toBe(2000);
    });

    it('guarantees round-trip decimal conversion consistency', () => {
      const values = [0.01, 0.5, 1.25, 99.99, 1000.5, 35000.75];
      for (const val of values) {
        const minor = parseDecimalToMinor(val);
        const decimal = minorToDecimal(minor);
        expect(decimal).toBe(val);
      }
    });
  });

  describe('Missing Categories & Empty States', () => {
    it('includes all standard categories in breakdown even when no expenses exist for them', () => {
      const expensesWithOnlyTwoCategories: ExpenseItem[] = [
        {
          id: 'exp-venue',
          categoryId: 'venue',
          name: 'Main Space',
          estimatedCostMinor: 2000000,
          actualCostMinor: 2000000,
          paidMinor: 1000000,
          status: 'confirmed',
          priority: 'must_have',
        },
        {
          id: 'exp-cat',
          categoryId: 'catering',
          name: 'Buffet',
          estimatedCostMinor: 1000000,
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'must_have',
        },
      ];

      const summary = calculateBudgetSummary(mockEvent, expensesWithOnlyTwoCategories);
      expect(summary.categoryBreakdown.length).toBe(ALL_CATEGORIES.length);

      for (const cat of summary.categoryBreakdown) {
        if (cat.categoryId === 'venue' || cat.categoryId === 'catering') {
          expect(cat.itemCount).toBe(1);
          expect(cat.allocatedMinor).toBeGreaterThan(0);
        } else {
          expect(cat.itemCount).toBe(0);
          expect(cat.allocatedMinor).toBe(0);
          expect(cat.confirmedMinor).toBe(0);
          expect(cat.paidMinor).toBe(0);
          expect(cat.percentageOfBudget).toBe(0);
        }
      }
    });
  });

  describe('Over-Budget Scenarios & Deficit Calculations', () => {
    it('computes exact deficit and flags over-budget status when commitments + contingency exceed budget', () => {
      const overExpenses: ExpenseItem[] = [
        {
          id: 'exp-big',
          categoryId: 'venue',
          name: 'Luxury Resort',
          estimatedCostMinor: 4800000, // $48,000
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'must_have',
        },
      ];

      // Total budget = $50,000 (5000000), 10% contingency = $5,000 (500000)
      // Total required = 48,000 + 5,000 = 53,000 => Over by 3,000 (300000)
      const summary = calculateBudgetSummary(mockEvent, overExpenses);
      expect(summary.isOverBudget).toBe(true);
      expect(summary.unallocatedMinor).toBe(-300000);
      expect(summary.varianceMinor).toBe(200000); // Available budget - committed
    });
  });

  describe('3-Tier Planning Alternatives (Economical, Balanced, Premium)', () => {
    const mixedExpenses: ExpenseItem[] = [
      {
        id: 'exp-1',
        categoryId: 'venue',
        name: 'Ballroom',
        estimatedCostMinor: 2000000,
        actualCostMinor: 2000000,
        paidMinor: 1000000,
        status: 'confirmed',
        priority: 'must_have',
      },
      {
        id: 'exp-2',
        categoryId: 'catering',
        name: 'Plated Lunch',
        estimatedCostMinor: 1500000,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'must_have',
      },
      {
        id: 'exp-3',
        categoryId: 'entertainment',
        name: 'Keynote Speaker & AV',
        estimatedCostMinor: 800000,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'nice_to_have',
      },
      {
        id: 'exp-4',
        categoryId: 'decor',
        name: 'Executive Swag & Floral Centerpieces',
        estimatedCostMinor: 400000,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'optional',
      },
    ];

    it('generates strictly hierarchical tiers: economical <= balanced <= premium', () => {
      const alternatives = generateBudgetAlternatives(mockEvent, mixedExpenses);

      expect(alternatives.economical).toBeDefined();
      expect(alternatives.balanced).toBeDefined();
      expect(alternatives.premium).toBeDefined();

      const econTotal = alternatives.economical.totalEstimatedMinor;
      const balTotal = alternatives.balanced.totalEstimatedMinor;
      const premTotal = alternatives.premium.totalEstimatedMinor;

      expect(econTotal).toBeLessThanOrEqual(balTotal);
      expect(balTotal).toBeLessThanOrEqual(premTotal);

      // Economical must have trimmed optional items
      const econDecor = alternatives.economical.expenses.find((e) => e.id === 'exp-4');
      expect(econDecor?.estimatedCostMinor).toBeLessThan(400000);

      // Premium must have elevated catering or entertainment
      const premCatering = alternatives.premium.expenses.find((e) => e.id === 'exp-2');
      expect(premCatering?.estimatedCostMinor).toBeGreaterThan(1500000);
    });

    it('applies budget alternative atomically without dropping unlisted items', () => {
      const alternatives = generateBudgetAlternatives(mockEvent, mixedExpenses);
      const applied = applyBudgetAlternative(mixedExpenses, alternatives.economical);

      expect(applied.length).toBe(mixedExpenses.length);
      const decorItem = applied.find((e) => e.id === 'exp-4');
      expect(decorItem?.estimatedCostMinor).toBe(alternatives.economical.expenses.find((e) => e.id === 'exp-4')?.estimatedCostMinor);
    });
  });
});
