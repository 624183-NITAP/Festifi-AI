import { describe, expect, it } from 'vitest';
import { applyCopilotResult } from '@/domain/ai/copilot';
import { CopilotResult, EventDetails, ExpenseItem, TimelineTask } from '@/domain/types';

describe('AI Copilot Mutation Engine (applyCopilotResult)', () => {
  const initialEvent: EventDetails = {
    id: 'ev-test',
    title: 'Emerald Forest Wedding',
    type: 'wedding',
    theme: 'Rustic Woodland',
    targetDate: '2027-06-15',
    guestCount: 80,
    currency: 'USD',
    totalBudgetMinor: 2500000,
    contingencyPercentage: 10,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const initialExpenses: ExpenseItem[] = [
    {
      id: 'exp-1',
      categoryId: 'venue',
      name: 'Forest Lodge',
      estimatedCostMinor: 1000000,
      actualCostMinor: null,
      paidMinor: 200000,
      status: 'confirmed',
      priority: 'must_have',
    },
    {
      id: 'exp-2',
      categoryId: 'decor',
      name: 'Custom Ice Sculptures',
      estimatedCostMinor: 300000,
      actualCostMinor: null,
      paidMinor: 0,
      status: 'planned',
      priority: 'optional',
    },
  ];

  const initialTasks: TimelineTask[] = [
    {
      id: 't-1',
      title: 'Sign Venue Contract',
      description: 'Confirm deposit',
      category: 'venue',
      deadline: '2027-01-15',
      daysBeforeEvent: 151,
      completed: true,
      priority: 'must_have',
      dependencies: [],
      milestone: '5 Months Before',
    },
  ];

  it('updates existing expenses, removes cut items, and adds new items cleanly', () => {
    const copilotResult: CopilotResult = {
      actionType: 'budget_reduction',
      prompt: 'Reduce optional decor by cutting ice sculptures',
      summary: 'Trimmed optional ice sculpture and added cheaper wood signs.',
      isLive: false,
      providerName: 'Deterministic Fallback',
      proposedExpenseChanges: [
        {
          id: 'exp-2',
          name: 'Custom Ice Sculptures',
          categoryId: 'decor',
          estimatedCostMinor: 0,
          deltaMinor: -300000,
          action: 'remove',
          rationale: 'Removed optional luxury item',
        },
        {
          name: 'Handcrafted Wooden Welcome Signage',
          categoryId: 'decor',
          estimatedCostMinor: 50000,
          deltaMinor: 50000,
          action: 'add',
          rationale: 'Cost-effective alternative',
        },
      ],
    };

    const applied = applyCopilotResult(
      { event: initialEvent, expenses: initialExpenses, tasks: initialTasks },
      copilotResult
    );

    expect(applied.updatedExpenses).toBeDefined();
    expect(applied.updatedExpenses).toHaveLength(2);

    // exp-2 should be removed
    expect(applied.updatedExpenses?.find((e) => e.id === 'exp-2')).toBeUndefined();

    // New item should be added with generated ID and planned status
    const addedItem = applied.updatedExpenses?.find(
      (e) => e.name === 'Handcrafted Wooden Welcome Signage'
    );
    expect(addedItem).toBeDefined();
    expect(addedItem?.estimatedCostMinor).toBe(50000);
    expect(addedItem?.status).toBe('planned');

    // Original array must remain unmodified (immutability check)
    expect(initialExpenses).toHaveLength(2);
  });

  it('applies task additions with calculated deadline dates derived from event targetDate', () => {
    const copilotResult: CopilotResult = {
      actionType: 'rain_contingency',
      prompt: 'Add rain contingency plan',
      summary: 'Added weather contingency tasks and marquee rental check.',
      isLive: false,
      providerName: 'Deterministic Fallback',
      proposedTaskChanges: [
        {
          title: 'Reserve Weather Backup Marquee',
          description: 'Place 48-hour tentative hold on waterproof pavilion tent',
          category: 'venue',
          daysBeforeEvent: 14,
          priority: 'must_have',
          milestone: '2 Weeks Before',
          action: 'add',
          rationale: 'Safeguards outdoor reception',
        },
      ],
    };

    const applied = applyCopilotResult(
      { event: initialEvent, expenses: initialExpenses, tasks: initialTasks },
      copilotResult
    );

    expect(applied.updatedTasks).toBeDefined();
    expect(applied.updatedTasks).toHaveLength(2);

    const newTask = applied.updatedTasks?.find((t) =>
      t.title.includes('Weather Backup Marquee')
    );
    expect(newTask).toBeDefined();
    expect(newTask?.category).toBe('venue');
    expect(newTask?.completed).toBe(false);
    expect(newTask?.deadline).toBeDefined();
    expect(newTask?.daysBeforeEvent).toBe(14);
  });

  it('updates total budget and contingency when proposedEventChanges is present', () => {
    const copilotResult: CopilotResult = {
      actionType: 'budget_reduction',
      prompt: 'Reduce total budget by 10%',
      summary: 'Updated event budget ceiling from $25,000 to $22,500.',
      isLive: false,
      providerName: 'Deterministic Fallback',
      proposedEventChanges: {
        totalBudgetMinor: 2250000,
        contingencyPercentage: 12,
      },
    };

    const applied = applyCopilotResult(
      { event: initialEvent, expenses: initialExpenses, tasks: initialTasks },
      copilotResult
    );

    expect(applied.updatedEvent).toBeDefined();
    expect(applied.updatedEvent?.totalBudgetMinor).toBe(2250000);
    expect(applied.updatedEvent?.contingencyPercentage).toBe(12);
    expect(applied.updatedEvent?.updatedAt).toBeDefined();
  });
});
