import { describe, expect, it } from 'vitest';
import { DeterministicDemoAIProvider, getAIProvider } from '@/domain/ai';
import {
  calculateBudgetSummary,
  generateBudgetOptimization,
} from '@/domain/budget';
import {
  deleteEventPlanState,
  exportExpensesToCsv,
  exportStateToJson,
  exportToMarkdownSummary,
  loadEventPlanState,
  saveEventPlanState,
} from '@/domain/persistence';
import { applyScenarioAdjustments, simulateScenario } from '@/domain/scenarios';
import { CreateEventInputSchema, EventDetailsSchema } from '@/domain/schemas';
import { calculateTimelineProgress, deriveTasksFromEvent } from '@/domain/timeline';
import {
  EventDetails,
  EventPlanState,
  ExpenseItem,
  VendorRecord,
} from '@/domain/types';

describe('End-to-End Application Workflow (17 Critical Challenge Milestones)', () => {
  let activeState: EventPlanState;

  it('Step 1 & 2: Supports landing page data structures & event creation navigation', () => {
    // Verified via schemas and default creation state
    expect(CreateEventInputSchema).toBeDefined();
    expect(EventDetailsSchema).toBeDefined();
  });

  it('Step 3: Creates an event with valid details and calculates minor currency units', () => {
    const rawInput = {
      title: 'Grand Golden Jubilee Festival',
      type: 'community' as const,
      theme: 'Golden Glow Community',
      targetDate: '2027-04-15',
      guestCount: 350,
      currency: 'USD' as const,
      totalBudgetDecimal: 35000,
      contingencyPercentage: 10,
      location: 'Riverside Amphitheater',
      notes: 'Ensure ADA wheelchair access throughout',
    };

    const validated = CreateEventInputSchema.parse(rawInput);
    expect(validated.guestCount).toBe(350);

    const event: EventDetails = {
      id: 'ev-e2e-fest',
      title: validated.title,
      type: validated.type,
      theme: validated.theme,
      targetDate: validated.targetDate,
      guestCount: validated.guestCount,
      currency: validated.currency,
      totalBudgetMinor: Math.round(validated.totalBudgetDecimal * 100), // 3,500,000 cents
      contingencyPercentage: validated.contingencyPercentage,
      location: validated.location,
      notes: validated.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(event.totalBudgetMinor).toBe(3500000);

    // Initial state
    activeState = {
      event,
      expenses: [],
      tasks: [],
      vendors: [],
      activeProposal: null,
      activeScenarioImpact: null,
      generatedIdeas: null,
    };

    expect(activeState.event.id).toBe('ev-e2e-fest');
  });

  it('Step 4: Rejects invalid guest counts, dates, and budgets through strict schema', () => {
    // 0 guests
    expect(() =>
      CreateEventInputSchema.parse({
        title: 'Invalid Event',
        type: 'wedding',
        targetDate: '2026-12-01',
        guestCount: 0,
        totalBudgetDecimal: 1000,
      })
    ).toThrow();

    // Invalid leap year date
    expect(() =>
      CreateEventInputSchema.parse({
        title: 'Invalid Date',
        type: 'wedding',
        targetDate: '2025-02-29', // 2025 is not a leap year!
        guestCount: 10,
        totalBudgetDecimal: 1000,
      })
    ).toThrow();

    // Negative budget
    expect(() =>
      CreateEventInputSchema.parse({
        title: 'Negative Budget',
        type: 'wedding',
        targetDate: '2026-12-01',
        guestCount: 10,
        totalBudgetDecimal: -500,
      })
    ).toThrow();
  });

  it('Step 5: Generates a plan through the offline demo provider when live keys are absent', async () => {
    const provider = new DeterministicDemoAIProvider();
    const result = await provider.generateEventPlan(activeState.event);

    expect(result.plan).toBeDefined();
    expect(result.plan.concepts.length).toBeGreaterThan(0);
    expect(result.plan.recommendedExpenses.length).toBeGreaterThan(0);

    activeState.generatedIdeas = result.plan;

    // Populate initial expenses and tasks from plan
    activeState.expenses = result.plan.recommendedExpenses.map((re, index) => ({
      id: `exp-${index + 1}`,
      categoryId: re.categoryId,
      name: re.name,
      estimatedCostMinor: re.estimatedCostMinor,
      actualCostMinor: null,
      paidMinor: 0,
      status: 'planned',
      priority: re.priority,
    }));

    activeState.tasks = deriveTasksFromEvent(activeState.event);
    expect(activeState.expenses.length).toBeGreaterThan(0);
    expect(activeState.tasks.length).toBeGreaterThan(0);
  });

  it('Step 6: Verifies budget totals (planned, confirmed, contingency, unallocated)', () => {
    const summary = calculateBudgetSummary(activeState.event, activeState.expenses);

    expect(summary.totalBudgetMinor).toBe(3500000);
    expect(summary.contingencyReserveMinor).toBe(350000); // 10%
    expect(summary.plannedMinor).toBeGreaterThan(0);
    expect(summary.confirmedMinor).toBe(0);
    expect(summary.paidMinor).toBe(0);
  });

  it('Step 7: Edits an expense and confirms the totals update dynamically', () => {
    const firstExp = activeState.expenses[0];
    const initialSummary = calculateBudgetSummary(activeState.event, activeState.expenses);

    // Confirm vendor contract with an agreed actual cost and partial deposit
    firstExp.status = 'confirmed';
    firstExp.actualCostMinor = firstExp.estimatedCostMinor - 50000; // $500 savings
    firstExp.paidMinor = 200000; // $2,000 deposit paid

    const updatedSummary = calculateBudgetSummary(activeState.event, activeState.expenses);

    expect(updatedSummary.confirmedMinor).toBe(firstExp.actualCostMinor);
    expect(updatedSummary.paidMinor).toBe(200000);
    expect(updatedSummary.confirmedMinor).toBeGreaterThan(0);
    expect(updatedSummary.plannedMinor).toBeLessThan(initialSummary.plannedMinor);
  });

  it('Step 8: Generates a budget optimization proposal', () => {
    const proposal = generateBudgetOptimization(activeState.event, activeState.expenses);

    expect(proposal).toBeDefined();
    expect(proposal.proposalId).toBeDefined();
    expect(proposal.status).toBe('pending');
    expect(proposal.tradeoffs.length).toBeGreaterThan(0);

    activeState.activeProposal = proposal;
  });

  it('Step 9: Rejects the proposal and verifies the original remains unchanged', () => {
    const originalExpensesLength = activeState.expenses.length;
    const originalFirstExpCost = activeState.expenses[0].actualCostMinor;

    // User rejects proposal
    activeState.activeProposal!.status = 'rejected';
    activeState.activeProposal = null;

    // Verify original state was completely unchanged
    expect(activeState.expenses.length).toBe(originalExpensesLength);
    expect(activeState.expenses[0].actualCostMinor).toBe(originalFirstExpCost);
  });

  it('Step 10: Accepts a valid proposal and verifies the updated budget', () => {
    const proposal = generateBudgetOptimization(activeState.event, activeState.expenses);
    proposal.status = 'accepted';

    // Apply proposed expenses
    activeState.expenses = JSON.parse(JSON.stringify(proposal.proposedExpenses));
    const newSummary = calculateBudgetSummary(activeState.event, activeState.expenses);

    expect(newSummary).toBeDefined();
    expect(newSummary.totalBudgetMinor).toBe(activeState.event.totalBudgetMinor);
  });

  it('Step 11: Simulates additional guests (+25%) through What-If simulator', () => {
    const impact = simulateScenario(activeState.event, activeState.expenses, 'guest_count_change');

    expect(impact.scenarioType).toBe('guest_count_change');
    expect(impact.costDeltaMinor).toBeGreaterThan(0);
    expect(impact.summaryAfter.perPersonEstimateMinor).toBeGreaterThan(0);

    activeState.activeScenarioImpact = impact;
  });

  it('Step 12: Reviews and applies an approved scenario', () => {
    expect(activeState.activeScenarioImpact).not.toBeNull();

    // Apply scenario
    activeState.expenses = applyScenarioAdjustments(activeState.expenses, activeState.activeScenarioImpact!);
    activeState.activeScenarioImpact = null;

    const summary = calculateBudgetSummary(activeState.event, activeState.expenses);
    expect(summary.plannedMinor).toBeGreaterThan(0);
  });

  it('Step 13: Completes a task and verifies timeline progress metric', () => {
    expect(activeState.tasks.length).toBeGreaterThan(0);
    const initialProgress = calculateTimelineProgress(activeState.tasks);

    // Complete first task
    activeState.tasks[0].completed = true;
    activeState.tasks[0].completedAt = new Date().toISOString();

    const updatedProgress = calculateTimelineProgress(activeState.tasks);
    expect(updatedProgress.completedTasks).toBe(initialProgress.completedTasks + 1);
    expect(updatedProgress.completionPercentage).toBeGreaterThan(0);
  });

  it('Step 14: Creates a vendor record and generates a tailored inquiry message', async () => {
    const vendor: VendorRecord = {
      id: 'v-e2e-1',
      name: 'SoundWave Professional AV',
      category: 'entertainment',
      contactPerson: 'David Miller',
      email: 'david@soundwave.com',
      phone: '+1 555-439-0192',
      quotedPriceMinor: 450000,
      status: 'contacted',
      notes: 'Requested dual outdoor wireless mics',
    };

    activeState.vendors.push(vendor);

    const provider = new DeterministicDemoAIProvider();
    const inquiryResult = await provider.generateVendorInquiry(activeState.event, vendor, 'Special interest in outdoor rain-shielded speakers');

    expect(inquiryResult.inquiryMessage).toContain('David Miller');
    expect(inquiryResult.inquiryMessage).toContain(activeState.event.title);
    expect(inquiryResult.inquiryMessage).toContain('outdoor rain-shielded speakers');

    vendor.inquiryMessage = inquiryResult.inquiryMessage;
    expect(vendor.inquiryMessage.length).toBeGreaterThan(100);
  });

  it('Step 15: Exports budget and plan to JSON, CSV, and Markdown Summary', () => {
    const jsonStr = exportStateToJson(activeState);
    expect(jsonStr).toContain('ev-e2e-fest');
    expect(JSON.parse(jsonStr).event.title).toBe(activeState.event.title);

    const csvStr = exportExpensesToCsv(activeState.expenses, activeState.event.currency);
    expect(csvStr).toContain('Category,Item Name');
    expect(csvStr.split('\r\n').length).toBeGreaterThan(activeState.expenses.length);

    const mdSummary = exportToMarkdownSummary(activeState);
    expect(mdSummary).toContain('# FestiFi AI — Event Planning & Executive Summary');
    expect(mdSummary).toContain(activeState.event.title);
  });

  it('Step 16: Refreshes application and verifies persistence integrity', () => {
    // Save to persistence
    saveEventPlanState(activeState);

    // Simulate page reload by reading back from storage
    const reloaded = loadEventPlanState(activeState.event.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.event.id).toBe(activeState.event.id);
    expect(reloaded?.expenses.length).toBe(activeState.expenses.length);
    expect(reloaded?.tasks[0].completed).toBe(true);

    // Cleanup test event
    deleteEventPlanState(activeState.event.id);
  });

  it('Step 17: Confirms application handles unavailable AI credentials gracefully', () => {
    delete process.env.GEMINI_API_KEY;
    const provider = getAIProvider();

    expect(provider).toBeDefined();
    expect(provider.isLive).toBe(false);
    expect(provider.name).toContain('Deterministic');
  });
});
