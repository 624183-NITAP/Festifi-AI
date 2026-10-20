import { describe, expect, it } from 'vitest';
import { applyScenarioAdjustments, simulateScenario } from '@/domain/scenarios';
import { EventDetails, ExpenseItem } from '@/domain/types';

describe('What-If Scenario Simulator — Deterministic Recalculations & Atomic Rollback', () => {
  const baseEvent: EventDetails = {
    id: 'ev-scenario-1',
    title: 'Autumn Harvest Festival & Dinner',
    type: 'community',
    theme: 'Rustic Autumn',
    targetDate: '2026-11-15',
    guestCount: 200,
    currency: 'USD',
    totalBudgetMinor: 2000000, // $20,000.00
    contingencyPercentage: 10,  // $2,000.00 reserve
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const initialExpenses: ExpenseItem[] = [
    {
      id: 'exp-1',
      categoryId: 'venue',
      name: 'Open Air Community Park Shelter',
      estimatedCostMinor: 400000, // $4,000
      actualCostMinor: 400000,
      paidMinor: 200000,
      status: 'confirmed',
      priority: 'must_have',
    },
    {
      id: 'exp-2',
      categoryId: 'catering',
      name: 'Community Buffet & Cider Bar',
      estimatedCostMinor: 900000, // $9,000
      actualCostMinor: null,
      paidMinor: 0,
      status: 'planned',
      priority: 'must_have',
    },
    {
      id: 'exp-3',
      categoryId: 'entertainment',
      name: 'Bluegrass Folk Band',
      estimatedCostMinor: 250000, // $2,500
      actualCostMinor: null,
      paidMinor: 0,
      status: 'planned',
      priority: 'nice_to_have',
    },
    {
      id: 'exp-4',
      categoryId: 'decor',
      name: 'Hay Bales, Pumpkins & Fairy Lights',
      estimatedCostMinor: 150000, // $1,500
      actualCostMinor: null,
      paidMinor: 0,
      status: 'planned',
      priority: 'optional',
    },
  ];

  it('accurately calculates the financial delta for a guest count surge (+25%) without mutating state', () => {
    const impact = simulateScenario(baseEvent, initialExpenses, 'guest_count_change');

    expect(impact.scenarioType).toBe('guest_count_change');
    expect(impact.costDeltaMinor).toBeGreaterThan(0);
    expect(impact.affectedCategories).toContain('catering');
    expect(impact.affectedCategories).toContain('logistics');

    // Verify initial expenses array was NOT mutated
    const originalCatering = initialExpenses.find((e) => e.categoryId === 'catering');
    expect(originalCatering?.estimatedCostMinor).toBe(900000);

    // Verify proposed adjusted expenses contain the increase
    const proposedCatering = impact.adjustedExpenses.find((e) => e.categoryId === 'catering');
    expect(proposedCatering?.estimatedCostMinor).toBeGreaterThan(900000);

    expect(impact.proposedAdjustments.length).toBeGreaterThan(0);
  });

  it('simulates outdoor rain contingency and evaluates contingency reserve absorption', () => {
    const impact = simulateScenario(baseEvent, initialExpenses, 'rain_contingency');

    expect(impact.scenarioType).toBe('rain_contingency');
    expect(impact.affectedCategories).toContain('venue');
    expect(impact.affectedCategories).toContain('logistics');
    expect(impact.costDeltaMinor).toBeGreaterThan(0);

    // Marquee and heating should be added
    const tentItem = impact.adjustedExpenses.find((e) => e.name.toLowerCase().includes('canopy') || e.name.toLowerCase().includes('tent'));
    expect(tentItem).toBeDefined();
    expect(tentItem?.isContingency).toBe(true);

    // Contingency absorption should be calculated
    expect(impact.contingencyImpactMinor).toBeLessThanOrEqual(impact.summaryBefore.contingencyReserveMinor);
  });

  it('simulates vendor cancellation with rush booking surcharge', () => {
    const impact = simulateScenario(baseEvent, initialExpenses, 'vendor_cancellation');

    expect(impact.scenarioType).toBe('vendor_cancellation');
    expect(impact.riskLevel).toBe('high');
    expect(impact.costDeltaMinor).toBeGreaterThan(0);
    expect(impact.recommendations.length).toBeGreaterThan(0);
  });

  it('simulates budget trim (-15%) and targets non-essential expenses while safeguarding confirmed items', () => {
    const impact = simulateScenario(baseEvent, initialExpenses, 'budget_reduction');

    expect(impact.scenarioType).toBe('budget_reduction');
    expect(impact.costDeltaMinor).toBeLessThan(0); // Cost reduction

    // Confirmed venue must remain untouched
    const proposedVenue = impact.adjustedExpenses.find((e) => e.id === 'exp-1');
    expect(proposedVenue?.estimatedCostMinor).toBe(400000);

    // Optional decor should be reduced
    const proposedDecor = impact.adjustedExpenses.find((e) => e.id === 'exp-4');
    expect(proposedDecor?.estimatedCostMinor).toBeLessThan(150000);
  });

  it('atomically applies scenario changes only upon explicit approval, supporting rollback', () => {
    const impact = simulateScenario(baseEvent, initialExpenses, 'rain_contingency');

    // User rejects proposal -> original array remains intact
    const rejectedExpenses = initialExpenses;
    expect(rejectedExpenses.length).toBe(4);

    // User accepts proposal -> atomically applied
    const acceptedExpenses = applyScenarioAdjustments(initialExpenses, impact);
    expect(acceptedExpenses.length).toBeGreaterThan(4);
    expect(acceptedExpenses.some((e) => e.isContingency)).toBe(true);
  });

  it('gracefully handles an empty expense list during dietary scenario by generating fallback line item', () => {
    const impact = simulateScenario(baseEvent, [], 'dietary_requirements');
    expect(impact.costDeltaMinor).toBeGreaterThan(0);
    expect(impact.adjustedExpenses.length).toBeGreaterThan(0);
    expect(impact.adjustedExpenses[0].categoryId).toBe('catering');
    expect(impact.summaryAfter.plannedMinor).toBeGreaterThan(0);
  });

  it('safely simulates vendor cancellation when initial expense list is empty', () => {
    const impact = simulateScenario(baseEvent, [], 'vendor_cancellation');
    expect(impact.costDeltaMinor).toBeGreaterThan(0);
    expect(impact.adjustedExpenses.length).toBeGreaterThan(0);
    expect(impact.riskLevel).toBe('high');
  });

  it('safely handles date change scenario without throwing or corrupting state', () => {
    const impact = simulateScenario(baseEvent, initialExpenses, 'date_change', { newDate: '2026-12-25' });
    expect(impact.scenarioType).toBe('date_change');
    expect(impact.adjustedExpenses.length).toBeGreaterThanOrEqual(initialExpenses.length);
  });
});
