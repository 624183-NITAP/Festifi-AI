import { describe, expect, it } from 'vitest';
import {
  calculateBudgetSummary,
  formatCurrencyMinor,
  generateBudgetOptimization,
  minorToDecimal,
  parseDecimalToMinor,
} from '@/domain/budget';
import { EventDetails, ExpenseItem } from '@/domain/types';

describe('Budget Engine — Core Calculations & Minor Currency Units', () => {
  const baseEvent: EventDetails = {
    id: 'ev-test-1',
    title: 'Silver Wedding Anniversary Gala',
    type: 'anniversary',
    theme: 'Silver Luminescence',
    targetDate: '2026-11-20',
    guestCount: 100,
    currency: 'USD',
    totalBudgetMinor: 2500000, // $25,000.00
    contingencyPercentage: 10,  // $2,500.00 reserve
    location: 'Metropolitan Conservatory',
    notes: 'Include vegetarian options',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  it('correctly parses decimal currency strings and numbers to integer minor units without float error', () => {
    expect(parseDecimalToMinor(100.5)).toBe(10050);
    expect(parseDecimalToMinor('1,500.75')).toBe(150075);
    expect(parseDecimalToMinor('$25,000.00')).toBe(2500000);
    expect(parseDecimalToMinor('0')).toBe(0);
    expect(parseDecimalToMinor(0)).toBe(0);

    // Rejects NaN, negative numbers and invalid inputs
    expect(() => parseDecimalToMinor(-50)).toThrow();
    expect(() => parseDecimalToMinor(NaN)).toThrow();
    expect(() => parseDecimalToMinor(Infinity)).toThrow();
    expect(() => parseDecimalToMinor('invalid-cash')).toThrow();
  });

  it('accurately converts minor units back to decimal', () => {
    expect(minorToDecimal(10050)).toBe(100.5);
    expect(minorToDecimal(2500000)).toBe(25000);
    expect(minorToDecimal(0)).toBe(0);
  });

  it('formats currency with localized symbol and decimal bounds', () => {
    expect(formatCurrencyMinor(2500000, 'USD', 'en-US')).toBe('$25,000.00');
    expect(formatCurrencyMinor(100000, 'GBP', 'en-GB')).toBe('£1,000.00');
    expect(formatCurrencyMinor(50000, 'EUR', 'de-DE')).toContain('500,00');
  });

  it('handles edge cases: zero budget, zero guests, empty expenses', () => {
    const zeroEvent = {
      totalBudgetMinor: 0,
      contingencyPercentage: 10,
      guestCount: 0,
    };
    const summary = calculateBudgetSummary(zeroEvent, []);

    expect(summary.totalBudgetMinor).toBe(0);
    expect(summary.contingencyReserveMinor).toBe(0);
    expect(summary.plannedMinor).toBe(0);
    expect(summary.confirmedMinor).toBe(0);
    expect(summary.paidMinor).toBe(0);
    expect(summary.unallocatedMinor).toBe(0);
    expect(summary.remainingMinor).toBe(0);
    expect(summary.perPersonEstimateMinor).toBe(0);
    expect(summary.isOverBudget).toBe(false);
  });

  it('computes planned, confirmed, paid, unallocated, and contingency reserves accurately without double counting', () => {
    const expenses: ExpenseItem[] = [
      {
        id: 'e1',
        categoryId: 'venue',
        name: 'Grand Ballroom Rental',
        estimatedCostMinor: 800000, // $8,000
        actualCostMinor: 750000,    // $7,500 confirmed
        paidMinor: 250000,          // $2,500 paid deposit
        status: 'confirmed',
        priority: 'must_have',
      },
      {
        id: 'e2',
        categoryId: 'catering',
        name: 'Plated Dinner & Dessert',
        estimatedCostMinor: 900000, // $9,000 planned
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'must_have',
      },
      {
        id: 'e3',
        categoryId: 'entertainment',
        name: 'Acoustic Trio',
        estimatedCostMinor: 200000, // $2,000 paid in full
        actualCostMinor: 200000,
        paidMinor: 200000,
        status: 'paid',
        priority: 'nice_to_have',
      },
      {
        id: 'e4',
        categoryId: 'decor',
        name: 'Custom Floral Arch',
        estimatedCostMinor: 150000, // $1,500 planned
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'optional',
      },
    ];

    const summary = calculateBudgetSummary(baseEvent, expenses);

    // Total Budget = $25,000 (2500000)
    expect(summary.totalBudgetMinor).toBe(2500000);

    // Contingency = 10% of 2500000 = 250000 ($2,500)
    expect(summary.contingencyReserveMinor).toBe(250000);

    // Confirmed items: e1 (750000) + e3 (200000) = 950000 ($9,500)
    expect(summary.confirmedMinor).toBe(950000);

    // Planned items: e2 (900000) + e4 (150000) = 1050000 ($10,500)
    expect(summary.plannedMinor).toBe(1050000);

    // Paid items: e1 (250000) + e3 (200000) = 450000 ($4,500)
    expect(summary.paidMinor).toBe(450000);

    // Total Committed = planned (1050000) + confirmed (950000) = 2000000 ($20,000)
    // Unallocated = 2500000 - contingency (250000) - committed (2000000) = 250000 ($2,500)
    expect(summary.unallocatedMinor).toBe(250000);

    // Remaining = Total Budget - Confirmed = 2500000 - 950000 = 1550000
    expect(summary.remainingMinor).toBe(1550000);

    // Per-Person Estimate = confirmed (950000) / 100 guests = 9500 ($95.00/head)
    expect(summary.perPersonEstimateMinor).toBe(9500);

    // Over budget flag
    expect(summary.isOverBudget).toBe(false);

    // Category breakdown
    const venueCat = summary.categoryBreakdown.find((c) => c.categoryId === 'venue');
    expect(venueCat?.confirmedMinor).toBe(750000);
    expect(venueCat?.percentageOfBudget).toBe(30); // 750000 / 2500000 = 30%
  });

  it('flags over-budget conditions when planned expenses exceed budget', () => {
    const overExpenses: ExpenseItem[] = [
      {
        id: 'e1',
        categoryId: 'venue',
        name: 'Exclusive Castle',
        estimatedCostMinor: 2400000,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'must_have',
      },
    ];

    // Total budget = 25,000. 10% contingency = 2,500. Total need = 26,500 > 25,000
    const summary = calculateBudgetSummary(baseEvent, overExpenses);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.unallocatedMinor).toBeLessThan(0);
  });

  it('generates deterministic budget optimization proposals protecting must-have items and confirmed contracts', () => {
    const tightExpenses: ExpenseItem[] = [
      {
        id: 'e1',
        categoryId: 'venue',
        name: 'Venue Booking',
        estimatedCostMinor: 1500000,
        actualCostMinor: 1500000,
        paidMinor: 500000,
        status: 'confirmed',
        priority: 'must_have', // Must not be cut
      },
      {
        id: 'e2',
        categoryId: 'catering',
        name: 'Catering Banquet',
        estimatedCostMinor: 800000,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'must_have', // Must not be cut
      },
      {
        id: 'e3',
        categoryId: 'decor',
        name: 'Custom Ice Sculptures',
        estimatedCostMinor: 250000,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'optional', // Can be cut
      },
      {
        id: 'e4',
        categoryId: 'entertainment',
        name: 'Fireworks Display',
        estimatedCostMinor: 300000,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'nice_to_have', // Can be negotiated down
      },
    ];

    const proposal = generateBudgetOptimization(baseEvent, tightExpenses);

    expect(proposal.proposalId).toBeDefined();
    expect(proposal.status).toBe('pending');
    expect(proposal.tradeoffs.length).toBeGreaterThan(0);

    // Must-have confirmed venue must NOT have been reduced
    const proposedVenue = proposal.proposedExpenses.find((e) => e.id === 'e1');
    expect(proposedVenue?.estimatedCostMinor).toBe(1500000);

    // Optional ice sculpture should have been reduced or omitted
    const proposedDecor = proposal.proposedExpenses.find((e) => e.id === 'e3');
    expect(proposedDecor?.estimatedCostMinor).toBeLessThan(250000);

    // Proposed summary after should show improved financial balance
    expect(proposal.summaryAfter.unallocatedMinor).toBeGreaterThan(proposal.summaryBefore.unallocatedMinor);
  });
});
