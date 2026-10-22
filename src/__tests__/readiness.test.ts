import { describe, expect, it } from 'vitest';
import { calculateEventReadiness } from '@/domain/readiness';
import { EventPlanState } from '@/domain/types';

describe('Operational Event Readiness Engine', () => {
  const baseState: EventPlanState = {
    event: {
      id: 'ev-readiness-test',
      title: 'Diamond Gala',
      type: 'corporate',
      theme: 'Sparkling Silver',
      targetDate: '2027-08-15',
      guestCount: 100,
      currency: 'USD',
      totalBudgetMinor: 2000000, // $20,000
      contingencyPercentage: 10,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
    expenses: [
      {
        id: 'exp-1',
        categoryId: 'venue',
        name: 'Pavilion Ballroom',
        estimatedCostMinor: 1000000,
        actualCostMinor: null,
        paidMinor: 500000,
        status: 'confirmed',
        priority: 'must_have',
      },
    ],
    tasks: [
      {
        id: 't-1',
        title: 'Book Venue',
        description: 'Sign agreement',
        category: 'venue',
        deadline: '2027-02-01',
        daysBeforeEvent: 195,
        completed: true,
        priority: 'must_have',
        dependencies: [],
        milestone: '6 Months',
      },
      {
        id: 't-2',
        title: 'Select Florist',
        description: 'Review bouquets',
        category: 'decor',
        deadline: '2027-05-01',
        daysBeforeEvent: 100,
        completed: false,
        priority: 'nice_to_have',
        dependencies: [],
        milestone: '3 Months',
      },
    ],
    guests: [
      {
        id: 'g-1',
        fullName: 'Alice Springs',
        email: 'alice@example.com',
        rsvpStatus: 'attending',
        plusOne: true,
        dietaryPreference: 'vegetarian',
        tableAssignment: '1',
        invitationSent: true,
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
      {
        id: 'g-2',
        fullName: 'Bob Marley',
        email: 'bob@marley.com',
        rsvpStatus: 'pending',
        plusOne: false,
        dietaryPreference: 'none',
        tableAssignment: undefined,
        invitationSent: true,
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    ],
    vendors: [
      {
        id: 'v-1',
        name: 'Pavilion Ballroom Catering',
        category: 'catering',
        contactPerson: 'Chef Laurent',
        email: 'chef@pavilion.com',
        phone: '555-0192',
        quotedPriceMinor: 800000,
        status: 'hired',
        notes: 'Deposit paid and menu confirmed.',
      },
    ],
    activeProposal: null,
    activeScenarioImpact: null,
    generatedIdeas: null,
  };

  it('correctly calculates weighted readiness pillars and overall composite score', () => {
    const readiness = calculateEventReadiness(baseState);

    // 1. Task pillar: 1/2 completed = 50% * 0.3 = 15
    expect(readiness.taskPillar.score).toBe(50);
    expect(readiness.taskPillar.weight).toBe(0.3);

    // 2. Budget pillar: solvent ($10,000 <= $20,000) = 100% * 0.3 = 30
    expect(readiness.budgetPillar.score).toBe(100);
    expect(readiness.budgetPillar.weight).toBe(0.3);

    // 3. Guest pillar: 1/2 responded = 50% * 0.2 = 10
    expect(readiness.guestPillar.score).toBe(50);
    expect(readiness.guestPillar.weight).toBe(0.2);

    // 4. Vendor pillar: 1/1 hired = 100% * 0.2 = 20
    expect(readiness.vendorPillar.score).toBe(100);
    expect(readiness.vendorPillar.weight).toBe(0.2);

    // Overall: 15 + 30 + 10 + 20 = 75 -> 'on_track'
    expect(readiness.overallScore).toBe(75);
    expect(readiness.status).toBe('on_track');
    expect(readiness.statusLabel).toBe('On Track');
  });

  it('penalizes readiness and triggers risk factor when budget is in deficit', () => {
    const overbudgetState: EventPlanState = {
      ...baseState,
      expenses: [
        {
          id: 'exp-big',
          categoryId: 'venue',
          name: 'Hyper Luxury Palace',
          estimatedCostMinor: 3000000, // $30,000 exceeds $20,000
          actualCostMinor: null,
          paidMinor: 0,
          status: 'confirmed',
          priority: 'must_have',
        },
      ],
    };

    const readiness = calculateEventReadiness(overbudgetState);
    expect(readiness.budgetPillar.score).toBe(40);
    expect(readiness.riskFactors).toContain('Committed and planned expenses exceed total budget ceiling.');
  });

  it('provides safe baseline default scores for empty state collections', () => {
    const emptyState: EventPlanState = {
      ...baseState,
      tasks: [],
      guests: [],
      vendors: [],
      expenses: [],
    };

    const readiness = calculateEventReadiness(emptyState);
    expect(readiness.taskPillar.score).toBe(0);
    expect(readiness.guestPillar.score).toBe(50); // Safe default for uninvited
    expect(readiness.vendorPillar.score).toBe(50); // Safe default for unlisted
    expect(readiness.budgetPillar.score).toBe(100); // 0 expenses <= 20,000
    expect(readiness.overallScore).toBeGreaterThanOrEqual(0);
    expect(readiness.overallScore).toBeLessThanOrEqual(100);
  });

  it('labels status as optimal when composite score is 85 or above', () => {
    const guests = baseState.guests || [];
    const optimalState: EventPlanState = {
      ...baseState,
      tasks: baseState.tasks.map((t) => ({ ...t, completed: true })),
      guests: guests.map((g) => ({ ...g, rsvpStatus: 'attending' })),
    };

    const readiness = calculateEventReadiness(optimalState);
    // 100 * 0.3 + 100 * 0.3 + 100 * 0.2 + 100 * 0.2 = 100
    expect(readiness.overallScore).toBe(100);
    expect(readiness.status).toBe('optimal');
    expect(readiness.statusLabel).toBe('Celebration Ready');
    expect(readiness.riskFactors).toHaveLength(0);
  });

  it('detects and flags overdue incomplete milestones in risk factors', () => {
    const overdueState: EventPlanState = {
      ...baseState,
      tasks: [
        {
          id: 't-overdue-1',
          title: 'Secure Marquee Deposit',
          description: 'Payment past due',
          category: 'venue',
          deadline: '2026-08-01', // Before reference date
          daysBeforeEvent: 379,
          completed: false,
          priority: 'must_have',
          dependencies: [],
          milestone: '12 Months',
        },
      ],
    };

    const readiness = calculateEventReadiness(overdueState, undefined, '2026-10-01');
    expect(readiness.riskFactors.some((r) => r.includes('past deadline and incomplete'))).toBe(true);
  });
});

