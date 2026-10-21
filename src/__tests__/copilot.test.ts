import { describe, expect, it } from 'vitest';
import { executeDeterministicCopilot } from '../domain/ai/copilot';
import { AICopilotRequestSchema, CopilotResultSchema } from '../domain/schemas';
import { EventDetails, ExpenseItem, TimelineTask } from '../domain/types';

const testEvent: EventDetails = {
  id: 'ev-test-wedding',
  title: 'Starlight Vineyard Wedding',
  type: 'wedding',
  theme: 'Rustic Romance & Wine',
  targetDate: '2027-09-20',
  guestCount: 100,
  currency: 'USD',
  totalBudgetMinor: 2000000, // $20,000.00
  contingencyPercentage: 10,
  location: 'Napa Valley Cellars',
  notes: 'Outdoor ceremony on lawn, indoor dinner in barrel room',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

const testExpenses: ExpenseItem[] = [
  {
    id: 'exp-venue',
    categoryId: 'venue',
    name: 'Vineyard Rental',
    estimatedCostMinor: 700000, // $7,000
    actualCostMinor: 700000,
    paidMinor: 350000,
    status: 'confirmed',
    priority: 'must_have',
  },
  {
    id: 'exp-cat',
    categoryId: 'catering',
    name: 'Plated Dinner & Wine',
    estimatedCostMinor: 800000, // $8,000
    actualCostMinor: null,
    paidMinor: 0,
    status: 'planned',
    priority: 'must_have',
  },
  {
    id: 'exp-photo',
    categoryId: 'photography',
    name: '8h Photography Package',
    estimatedCostMinor: 250000, // $2,500
    actualCostMinor: null,
    paidMinor: 0,
    status: 'planned',
    priority: 'nice_to_have',
  },
  {
    id: 'exp-decor',
    categoryId: 'decor',
    name: 'Floral Arches & Candlelight',
    estimatedCostMinor: 150000, // $1,500
    actualCostMinor: null,
    paidMinor: 0,
    status: 'planned',
    priority: 'nice_to_have',
  },
  {
    id: 'exp-favors',
    categoryId: 'invitations',
    name: 'Custom Engraved Wine Favors',
    estimatedCostMinor: 100000, // $1,000
    actualCostMinor: null,
    paidMinor: 0,
    status: 'planned',
    priority: 'optional',
  },
];

const testTasks: TimelineTask[] = [
  {
    id: 'task-1',
    title: 'Book Venue',
    description: 'Sign contract and pay deposit',
    category: 'venue',
    deadline: '2027-03-20',
    daysBeforeEvent: 184,
    completed: true,
    completedAt: '2026-10-15T00:00:00.000Z',
    priority: 'must_have',
    dependencies: [],
    milestone: '6 Months Before',
  },
  {
    id: 'task-2',
    title: 'Finalize Menu Tasting',
    description: 'Taste food and select wines',
    category: 'catering',
    deadline: '2027-06-20',
    daysBeforeEvent: 92,
    completed: false,
    completedAt: null,
    priority: 'must_have',
    dependencies: ['task-1'],
    milestone: '3 Months Before',
  },
];

describe('AI Event Copilot Engine (Deterministic Unit Tests)', () => {
  it('successfully calculates 15% budget reduction and safeguards confirmed contracts', () => {
    const result = executeDeterministicCopilot(
      { event: testEvent, expenses: testExpenses, tasks: testTasks },
      'budget_reduction',
      'Reduce total budget by 15%'
    );

    expect(result.actionType).toBe('budget_reduction');
    expect(result.isLive).toBe(false);
    expect(result.providerName).toContain('Deterministic');
    expect(result.proposedExpenseChanges).toBeDefined();

    // Verify schema validation
    const validated = CopilotResultSchema.parse(result);
    expect(validated.actionType).toBe('budget_reduction');

    // Confirmed venue must not be modified or removed
    const venueChange = result.proposedExpenseChanges?.find((c) => c.id === 'exp-venue');
    expect(venueChange).toBeUndefined();

    // Optional favors item should be targeted for reduction or removal
    const favorsChange = result.proposedExpenseChanges?.find((c) => c.id === 'exp-favors');
    expect(favorsChange).toBeDefined();
    expect(favorsChange!.deltaMinor).toBeLessThan(0);

    // Total budget should reflect 15% reduction (15% of 2,000,000 = 300,000 cut => 1,700,000)
    expect(result.proposedEventChanges?.totalBudgetMinor).toBe(1700000);
  });

  it('generates a complete 7-day preparation checklist with valid ISO deadlines', () => {
    const result = executeDeterministicCopilot(
      { event: testEvent, expenses: testExpenses, tasks: testTasks },
      'preparation_checklist',
      'Create 7-day checklist'
    );

    expect(result.actionType).toBe('preparation_checklist');
    expect(result.proposedTaskChanges).toBeDefined();
    expect(result.proposedTaskChanges!.length).toBe(7);

    // Ensure all 7 days are represented in countdown order (7 down to 1)
    const daysBefore = result.proposedTaskChanges!.map((t) => t.daysBeforeEvent);
    expect(daysBefore).toEqual([7, 6, 5, 4, 3, 2, 1]);

    // Check deadlines are mathematically valid relative to 2027-09-20
    expect(result.proposedTaskChanges![0].deadline).toBe('2027-09-13'); // 7 days before Sept 20
    expect(result.proposedTaskChanges![6].deadline).toBe('2027-09-19'); // 1 day before Sept 20

    // Validate schema
    expect(() => CopilotResultSchema.parse(result)).not.toThrow();
  });

  it('adds a comprehensive rain contingency plan with expenses and tasks', () => {
    const result = executeDeterministicCopilot(
      { event: testEvent, expenses: testExpenses, tasks: testTasks },
      'rain_contingency',
      'Add rain plan'
    );

    expect(result.actionType).toBe('rain_contingency');
    expect(result.proposedExpenseChanges).toBeDefined();
    expect(result.proposedExpenseChanges!.length).toBeGreaterThanOrEqual(1);

    // Tent rental line item added
    const tent = result.proposedExpenseChanges!.find((e) => e.name.toLowerCase().includes('canopy') || e.name.toLowerCase().includes('tent'));
    expect(tent).toBeDefined();
    expect(tent!.deltaMinor).toBeGreaterThan(0);

    // Decision cutoff task added
    const decisionTask = result.proposedTaskChanges?.find((t) => t.title.toLowerCase().includes('decision'));
    expect(decisionTask).toBeDefined();
    expect(decisionTask!.daysBeforeEvent).toBe(2);

    expect(() => CopilotResultSchema.parse(result)).not.toThrow();
  });

  it('suggests lower-cost alternatives for non-essential expenses', () => {
    const result = executeDeterministicCopilot(
      { event: testEvent, expenses: testExpenses, tasks: testTasks },
      'lower_cost_alternatives',
      'Suggest lower-cost alternatives'
    );

    expect(result.actionType).toBe('lower_cost_alternatives');
    expect(result.proposedExpenseChanges).toBeDefined();
    expect(result.proposedExpenseChanges!.length).toBeGreaterThan(0);

    // Every proposed change must offer positive savings (deltaMinor < 0)
    for (const change of result.proposedExpenseChanges!) {
      expect(change.deltaMinor).toBeLessThan(0);
      expect(change.estimatedCostMinor).toBeGreaterThanOrEqual(0);
    }

    expect(result.tradeoffs).toBeDefined();
    expect(result.tradeoffs!.length).toBeGreaterThan(0);
  });

  it('computes a rigorous realism audit with feasibility score and critique', () => {
    const result = executeDeterministicCopilot(
      { event: testEvent, expenses: testExpenses, tasks: testTasks },
      'realism_audit',
      'Audit budget and schedule realism'
    );

    expect(result.actionType).toBe('realism_audit');
    expect(result.realismAnalysis).toBeDefined();
    const analysis = result.realismAnalysis!;

    expect(analysis.feasibilityScore).toBeGreaterThanOrEqual(0);
    expect(analysis.feasibilityScore).toBeLessThanOrEqual(100);
    expect(['realistic', 'moderate_risk', 'high_risk']).toContain(analysis.status);
    expect(analysis.budgetCritique.length).toBeGreaterThan(0);
    expect(analysis.scheduleCritique.length).toBeGreaterThan(0);
    expect(analysis.actionableRecommendations.length).toBeGreaterThan(0);
  });

  it('validates request payload through AICopilotRequestSchema', () => {
    const validPayload = {
      actionType: 'budget_reduction',
      prompt: 'Reduce total budget by 15%',
      event: testEvent,
      expenses: testExpenses,
      tasks: testTasks,
    };

    const parseResult = AICopilotRequestSchema.safeParse(validPayload);
    expect(parseResult.success).toBe(true);

    // Rejects invalid actionType
    const invalidPayload = {
      ...validPayload,
      actionType: 'invalid_action_unknown',
    };
    const invalidResult = AICopilotRequestSchema.safeParse(invalidPayload);
    expect(invalidResult.success).toBe(false);
  });
});
