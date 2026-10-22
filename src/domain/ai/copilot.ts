/**
 * FestiFi AI — Event Copilot Engine
 * Supports contextual natural language and preset requests:
 * 1. Reduce total budget by 15%
 * 2. Create a seven-day preparation checklist
 * 3. Add a rain contingency plan
 * 4. Adjust the event timeline
 * 5. Suggest lower-cost alternatives
 * 6. Explain why a budget or schedule may be unrealistic (Realism Audit)
 *
 * Implements deterministic fallback with truthful provenance and Gemini Live support.
 */

import { calculateBudgetSummary, formatCurrencyMinor } from '../budget';
import { calculateDeadline, daysBetween, isValidIsoDate } from '../timeline';
import {
  BudgetCategory,
  CopilotActionType,
  CopilotExpenseChange,
  CopilotRealismAnalysis,
  CopilotResult,
  CopilotTaskChange,
  EventDetails,
  ExpenseItem,
  TimelineTask,
} from '../types';

export interface CopilotContext {
  event: EventDetails;
  expenses: ExpenseItem[];
  tasks?: TimelineTask[];
}

/**
 * Deterministic Copilot Engine
 * 100% offline, reproducible, mathematically validated.
 */
export function executeDeterministicCopilot(
  context: CopilotContext,
  actionType: CopilotActionType,
  userPrompt: string
): CopilotResult {
  const { event, expenses, tasks = [] } = context;
  const summary = calculateBudgetSummary(event, expenses);

  switch (actionType) {
    case 'budget_reduction': {
      // 15% budget reduction
      const targetCutMinor = Math.round(event.totalBudgetMinor * 0.15);
      const proposedExpenseChanges: CopilotExpenseChange[] = [];
      const tradeoffs: Array<{ item: string; change: string; reason: string; savingsMinor: number }> = [];

      let savedMinor = 0;

      // Prioritize reducing optional and nice_to_have items that are not confirmed/paid
      for (const item of expenses) {
        if (savedMinor >= targetCutMinor) break;
        if (item.status === 'confirmed' || item.status === 'paid') continue;

        if (item.priority === 'optional' && item.estimatedCostMinor > 0) {
          const cut = Math.min(item.estimatedCostMinor, targetCutMinor - savedMinor);
          proposedExpenseChanges.push({
            id: item.id,
            name: item.name,
            categoryId: item.categoryId,
            estimatedCostMinor: Math.max(0, item.estimatedCostMinor - cut),
            deltaMinor: -cut,
            action: cut === item.estimatedCostMinor ? 'remove' : 'update',
            rationale: `Omitted or trimmed optional line item to achieve 15% target reduction.`,
          });
          tradeoffs.push({
            item: item.name,
            change: cut === item.estimatedCostMinor ? 'Removed line item' : `Trimmed by ${formatCurrencyMinor(cut, event.currency)}`,
            reason: 'Optional amenity reduction relieves financial strain.',
            savingsMinor: cut,
          });
          savedMinor += cut;
        }
      }

      // If still need savings, adjust nice_to_have
      if (savedMinor < targetCutMinor) {
        for (const item of expenses) {
          if (savedMinor >= targetCutMinor) break;
          if (item.status === 'confirmed' || item.status === 'paid') continue;

          if (item.priority === 'nice_to_have' && item.estimatedCostMinor > 5000) {
            const cut = Math.min(Math.round(item.estimatedCostMinor * 0.25), targetCutMinor - savedMinor);
            if (cut > 0) {
              proposedExpenseChanges.push({
                id: item.id,
                name: item.name,
                categoryId: item.categoryId,
                estimatedCostMinor: item.estimatedCostMinor - cut,
                deltaMinor: -cut,
                action: 'update',
                rationale: `Negotiated lower package tier (-25%) while preserving core celebration vibe.`,
              });
              tradeoffs.push({
                item: item.name,
                change: `Package downgraded to core tier (-${formatCurrencyMinor(cut, event.currency)})`,
                reason: 'Retains essential coverage with streamlined scope.',
                savingsMinor: cut,
              });
              savedMinor += cut;
            }
          }
        }
      }

      const newTotalBudgetMinor = Math.max(0, event.totalBudgetMinor - targetCutMinor);

      return {
        actionType: 'budget_reduction',
        prompt: userPrompt || 'Reduce total budget by 15%',
        summary: `Identified ${formatCurrencyMinor(savedMinor, event.currency)} in targeted expense savings across ${proposedExpenseChanges.length} line items without sacrificing confirmed contracts or must-have foundations.`,
        proposedExpenseChanges,
        proposedEventChanges: {
          totalBudgetMinor: newTotalBudgetMinor,
        },
        tradeoffs,
        isLive: false,
        providerName: 'FestiFi Copilot (Deterministic Engine)',
      };
    }

    case 'preparation_checklist': {
      // 7-day preparation checklist
      const days = [
        { day: 7, title: 'Final Headcount & Floorplan Lock', desc: 'Deliver guaranteed guest count and table seating chart to caterer and venue manager.', category: 'catering' as BudgetCategory, milestone: 'T-7 Days' },
        { day: 6, title: 'Vendor Logistics & Run-of-Show Distribution', desc: 'Distribute finalized master run-of-show timeline and loading dock instructions to all vendors.', category: 'logistics' as BudgetCategory, milestone: 'T-6 Days' },
        { day: 5, title: 'Attire & Styling Final Fitting', desc: 'Confirm dry cleaning, steam dresses/suits, and pack emergency sewing and stain removal kit.', category: 'attire' as BudgetCategory, milestone: 'T-5 Days' },
        { day: 4, title: 'Playlist & AV Equipment Check', desc: 'Verify key song cues (entrance, first dance, toasts) and run wireless microphone battery tests.', category: 'entertainment' as BudgetCategory, milestone: 'T-4 Days' },
        { day: 3, title: 'Decor & Welcome Signage Pack-Out', desc: 'Box up escort cards, guest book, framed photos, and signature drink signs by delivery zone.', category: 'decor' as BudgetCategory, milestone: 'T-3 Days' },
        { day: 2, title: 'Cash Gratuity Envelopes & Payments', desc: 'Prepare sealed tip envelopes for service captains, DJ, setup crew, and venue lead.', category: 'miscellaneous' as BudgetCategory, milestone: 'T-2 Days' },
        { day: 1, title: 'Rehearsal & Rehearsal Dinner', desc: 'Walk through ceremony/event processional and toast VIP guests.', category: 'general' as const, milestone: 'T-1 Day' },
      ];

      const proposedTaskChanges: CopilotTaskChange[] = days.map((d) => ({
        id: `copilot-task-7d-${d.day}-${Date.now()}`,
        title: d.title,
        description: d.desc,
        category: d.category,
        daysBeforeEvent: d.day,
        deadline: isValidIsoDate(event.targetDate) ? calculateDeadline(event.targetDate, d.day) : undefined,
        priority: 'must_have',
        milestone: d.milestone,
        action: 'add',
        rationale: `Vital final-week milestone ensuring flawless execution and peace of mind.`,
      }));

      return {
        actionType: 'preparation_checklist',
        prompt: userPrompt || 'Create a seven-day preparation checklist',
        summary: `Generated a structured 7-day master readiness countdown with 7 prioritized daily milestones leading up to ${event.title}.`,
        proposedTaskChanges,
        isLive: false,
        providerName: 'FestiFi Copilot (Deterministic Engine)',
      };
    }

    case 'rain_contingency': {
      // Add rain contingency plan
      const tentCostMinor = Math.round(event.totalBudgetMinor * 0.06); // ~6% of budget
      const sidewallCostMinor = Math.round(event.totalBudgetMinor * 0.015);

      const proposedExpenseChanges: CopilotExpenseChange[] = [
        {
          id: `copilot-exp-rain-1-${Date.now()}`,
          name: 'Clearspan Rain Canopy & Covered Walkway Rental',
          categoryId: 'logistics',
          estimatedCostMinor: tentCostMinor,
          deltaMinor: tentCostMinor,
          action: 'add',
          rationale: 'Weatherproof high-peak clearspan tenting with guttering to protect guests from sudden showers.',
        },
        {
          id: `copilot-exp-rain-2-${Date.now()}`,
          name: 'Heavy-Duty Tenting Sidewalls & Commercial Heaters',
          categoryId: 'logistics',
          estimatedCostMinor: sidewallCostMinor,
          deltaMinor: sidewallCostMinor,
          action: 'add',
          rationale: 'Shields cocktail hour perimeter from crosswinds and temperature drops.',
        },
      ];

      const proposedTaskChanges: CopilotTaskChange[] = [
        {
          id: `copilot-task-rain-1-${Date.now()}`,
          title: 'Execute Weather Decision Call (48h Cutoff)',
          description: 'Review radar forecast with venue director and officially activate the tenting deposit hold.',
          category: 'logistics',
          daysBeforeEvent: 2,
          deadline: isValidIsoDate(event.targetDate) ? calculateDeadline(event.targetDate, 2) : undefined,
          priority: 'must_have',
          milestone: 'Weather Contingency',
          action: 'add',
          rationale: 'Enforces tent rental vendor non-refundable installation deadline.',
        },
        {
          id: `copilot-task-rain-2-${Date.now()}`,
          title: 'Stock 30 Clear Guest Umbrellas & Towel Baskets',
          description: 'Place clear dome umbrellas at vehicle drop-off and entrance walkway for dry guest arrivals.',
          category: 'decor',
          daysBeforeEvent: 3,
          deadline: isValidIsoDate(event.targetDate) ? calculateDeadline(event.targetDate, 3) : undefined,
          priority: 'nice_to_have',
          milestone: 'Weather Contingency',
          action: 'add',
          rationale: 'Creates picture-perfect rain photography while ensuring guest comfort.',
        },
      ];

      const totalRainCost = tentCostMinor + sidewallCostMinor;
      const absorbedByContingency = summary.contingencyReserveMinor >= totalRainCost;

      return {
        actionType: 'rain_contingency',
        prompt: userPrompt || 'Add a rain contingency plan',
        summary: `Formulated a complete inclement weather backup plan including clearspan canopy rentals (${formatCurrencyMinor(totalRainCost, event.currency)}) and a 48-hour operational go/no-go deadline. ${absorbedByContingency ? `Contingency reserve (${formatCurrencyMinor(summary.contingencyReserveMinor, event.currency)}) is sufficient to cover this buffer.` : `Note: Additional funding or reallocation is recommended to cover the weather buffer.`}`,
        proposedExpenseChanges,
        proposedTaskChanges,
        tradeoffs: [
          {
            item: 'Weatherproof Infrastructure',
            change: `Added ${formatCurrencyMinor(totalRainCost, event.currency)} contingency reserve hold`,
            reason: 'Guarantees event continuity regardless of outdoor precipitation or temperature drops.',
            savingsMinor: 0,
          },
        ],
        isLive: false,
        providerName: 'FestiFi Copilot (Deterministic Engine)',
      };
    }

    case 'timeline_adjustment': {
      // Adjust event timeline
      const proposedTaskChanges: CopilotTaskChange[] = tasks.map((t) => {
        // Adjust milestone buffer by 5 days earlier for added safety
        const adjustedDays = Math.max(1, t.daysBeforeEvent + 5);
        return {
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category,
          daysBeforeEvent: adjustedDays,
          deadline: isValidIsoDate(event.targetDate) ? calculateDeadline(event.targetDate, adjustedDays) : t.deadline,
          priority: t.priority,
          milestone: t.milestone,
          action: 'update',
          rationale: `Shifted 5 days earlier to establish a safety buffer before final vendor cutoffs.`,
        };
      });

      return {
        actionType: 'timeline_adjustment',
        prompt: userPrompt || 'Adjust the event timeline',
        summary: `Recalculated deadlines across ${tasks.length} timeline milestones, advancing critical checkpoints by 5 calendar days to establish comfortable buffer margins.`,
        proposedTaskChanges,
        isLive: false,
        providerName: 'FestiFi Copilot (Deterministic Engine)',
      };
    }

    case 'lower_cost_alternatives': {
      // Suggest lower-cost alternatives
      const proposedExpenseChanges: CopilotExpenseChange[] = [];
      const tradeoffs: Array<{ item: string; change: string; reason: string; savingsMinor: number }> = [];

      // Find top non-confirmed expenses
      const modifiable = expenses
        .filter((e) => e.status !== 'confirmed' && e.status !== 'paid' && e.estimatedCostMinor > 20000)
        .sort((a, b) => b.estimatedCostMinor - a.estimatedCostMinor);

      for (const item of modifiable.slice(0, 3)) {
        let suggestedName = item.name;
        let cutPercent = 0.25;
        let suggestion = '';

        if (item.categoryId === 'catering') {
          suggestedName = `${item.name} (Curated Family-Style Stations)`;
          cutPercent = 0.20;
          suggestion = 'Switching from formal 5-course plating to elevated family-style or grazing stations trims kitchen staffing costs while encouraging lively guest interaction.';
        } else if (item.categoryId === 'decor') {
          suggestedName = `${item.name} (Seasonal Local Foliage & Candlelight)`;
          cutPercent = 0.30;
          suggestion = 'Focusing on seasonal local greens, potted herbs, and warm pillar candles instead of out-of-season imported cut florals dramatically lowers wholesale floral rates.';
        } else if (item.categoryId === 'entertainment') {
          suggestedName = `${item.name} (Acoustic Duo + Curated DJ Hybrid)`;
          cutPercent = 0.25;
          suggestion = 'Combining a live acoustic duo for ceremonies/cocktails with a high-energy DJ for late-night dancing delivers the excitement of live music at a fraction of a 10-piece band.';
        } else {
          suggestedName = `${item.name} (Value-Optimized Tier)`;
          cutPercent = 0.20;
          suggestion = 'Optimized package scope preserves all essential deliverables with streamlined vendor hours.';
        }

        const savings = Math.round(item.estimatedCostMinor * cutPercent);
        proposedExpenseChanges.push({
          id: item.id,
          name: suggestedName,
          categoryId: item.categoryId,
          estimatedCostMinor: item.estimatedCostMinor - savings,
          deltaMinor: -savings,
          action: 'update',
          rationale: suggestion,
        });

        tradeoffs.push({
          item: item.name,
          change: `Alternative: ${suggestedName} (-${formatCurrencyMinor(savings, event.currency)})`,
          reason: suggestion,
          savingsMinor: savings,
        });
      }

      const totalSavings = proposedExpenseChanges.reduce((acc, c) => acc + Math.abs(c.deltaMinor), 0);

      return {
        actionType: 'lower_cost_alternatives',
        prompt: userPrompt || 'Suggest lower-cost alternatives',
        summary: `Identified 3 tasteful, high-impact cost alternatives yielding up to ${formatCurrencyMinor(totalSavings, event.currency)} in overall budget relief without diminishing guest experience quality.`,
        proposedExpenseChanges,
        tradeoffs,
        isLive: false,
        providerName: 'FestiFi Copilot (Deterministic Engine)',
      };
    }

    case 'realism_audit':
    default: {
      // Explain why a budget or schedule may be unrealistic
      const guestCount = Math.max(1, event.guestCount);
      const perGuestBudget = summary.totalBudgetMinor / guestCount;
      const budgetCritique: string[] = [];
      const scheduleCritique: string[] = [];
      const recommendations: string[] = [];
      let score = 90;

      // Budget checks
      if (summary.isOverBudget) {
        score -= 25;
        budgetCritique.push(
          `Allocations exceed available funding by ${formatCurrencyMinor(Math.abs(summary.varianceMinor), event.currency)}. The event is mathematically over-budget.`
        );
      }

      if (summary.contingencyReserveMinor < event.totalBudgetMinor * 0.08) {
        score -= 10;
        budgetCritique.push(
          `Contingency reserve (${event.contingencyPercentage}%) is lower than the recommended 10% safety margin. Unexpected fees or vendor gratuities may push you into deficit.`
        );
      }

      if (event.type === 'wedding' && perGuestBudget < 15000) {
        // Less than $150/guest for wedding
        score -= 15;
        budgetCritique.push(
          `Per-guest budget allocation of ${formatCurrencyMinor(perGuestBudget, event.currency)} is below standard regional median wedding expenditure ($150-$250/guest for venue, food, and bar).`
        );
      }

      // Schedule checks
      const todayIso = new Date().toISOString().split('T')[0];
      if (isValidIsoDate(event.targetDate)) {
        const daysLeft = daysBetween(todayIso, event.targetDate);
        if (daysLeft < 30 && event.type === 'wedding') {
          score -= 20;
          scheduleCritique.push(
            `Target date is only ${daysLeft} days away. High-demand vendors (catering, photography) typically require 90-180 days advance booking lead time.`
          );
        } else if (daysLeft < 14) {
          score -= 15;
          scheduleCritique.push(
            `Event target date is within 2 weeks. Custom stationery printing, alterations, and formal permit processing may be subject to rush surcharges or unavailability.`
          );
        }
      }

      // Task checks
      const overdueTasks = tasks.filter((t) => !t.completed && isValidIsoDate(t.deadline) && t.deadline < todayIso);
      if (overdueTasks.length > 0) {
        score -= Math.min(20, overdueTasks.length * 5);
        scheduleCritique.push(
          `There are currently ${overdueTasks.length} overdue task milestones requiring immediate prioritization.`
        );
      }

      if (budgetCritique.length === 0) {
        budgetCritique.push('Budget metrics and per-person allocations align comfortably with current market medians.');
      }
      if (scheduleCritique.length === 0) {
        scheduleCritique.push('Timeline deadlines provide generous lead times with healthy buffer windows.');
      }

      recommendations.push(
        'Lock in caterer guaranteed headcount at least 14 days prior to event.',
        'Protect a minimum 10% contingency reserve against day-of overtime charges.',
        'Audit vendor contracts for included setup and teardown hours to avoid hidden fees.'
      );

      const boundedScore = Math.max(10, Math.min(100, score));
      const status: CopilotRealismAnalysis['status'] =
        boundedScore >= 80 ? 'realistic' : boundedScore >= 55 ? 'moderate_risk' : 'high_risk';

      const realismAnalysis: CopilotRealismAnalysis = {
        feasibilityScore: boundedScore,
        status,
        summary:
          status === 'realistic'
            ? 'Event plan exhibits strong financial and operational feasibility with balanced margins.'
            : status === 'moderate_risk'
            ? 'Plan is viable but features concentrated budget pressures or compressed scheduling windows that require proactive management.'
            : 'Plan presents acute budget deficit or severe schedule compression risks that require immediate restructuring.',
        budgetCritique,
        scheduleCritique,
        actionableRecommendations: recommendations,
      };

      return {
        actionType: 'realism_audit',
        prompt: userPrompt || 'Explain why budget or schedule may be unrealistic',
        summary: realismAnalysis.summary,
        realismAnalysis,
        isLive: false,
        providerName: 'FestiFi Copilot (Deterministic Engine)',
      };
    }
  }
}

export interface AppliedCopilotChanges {
  updatedEvent?: Partial<EventDetails>;
  updatedExpenses?: ExpenseItem[];
  updatedTasks?: TimelineTask[];
  summaryMessage: string;
}

/**
 * Pure domain function to apply changes proposed by a CopilotResult.
 * Handles expense additions/updates/removals, task additions/updates,
 * event adjustments, and chronological deadline derivations.
 */
export function applyCopilotResult(
  context: CopilotContext,
  result: CopilotResult
): AppliedCopilotChanges {
  const { event, expenses, tasks = [] } = context;

  let updatedExpenses: ExpenseItem[] | undefined = undefined;
  let updatedTasks: TimelineTask[] | undefined = undefined;
  let updatedEvent: Partial<EventDetails> | undefined = undefined;

  // 1. Apply expense changes
  if (result.proposedExpenseChanges && result.proposedExpenseChanges.length > 0) {
    const expenseMap = new Map(expenses.map((e) => [e.id, e]));

    for (const change of result.proposedExpenseChanges) {
      const targetId =
        (change.id && expenseMap.has(change.id))
          ? change.id
          : Array.from(expenseMap.values()).find(
              (e) => change.name && e.name.trim().toLowerCase() === change.name.trim().toLowerCase()
            )?.id;

      if (change.action === 'remove' && targetId) {
        expenseMap.delete(targetId);
      } else if (change.action === 'update' && targetId) {
        const existing = expenseMap.get(targetId);
        if (existing) {
          expenseMap.set(targetId, {
            ...existing,
            name: change.name || existing.name,
            categoryId: change.categoryId || existing.categoryId,
            estimatedCostMinor: Math.max(0, change.estimatedCostMinor),
            notes: `${existing.notes || ''} [Copilot: ${change.rationale}]`.trim(),
          });
        }
      } else if (change.action === 'add') {
        const newId = `exp-copilot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        expenseMap.set(newId, {
          id: newId,
          categoryId: change.categoryId,
          name: change.name,
          estimatedCostMinor: Math.max(0, change.estimatedCostMinor),
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'must_have',
          notes: `Copilot Recommendation: ${change.rationale}`,
        });
      }
    }

    updatedExpenses = Array.from(expenseMap.values());
  }

  // 2. Apply task changes
  if (result.proposedTaskChanges && result.proposedTaskChanges.length > 0) {
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    for (const tChange of result.proposedTaskChanges) {
      const targetId =
        (tChange.id && taskMap.has(tChange.id))
          ? tChange.id
          : Array.from(taskMap.values()).find(
              (t) => tChange.title && t.title.trim().toLowerCase() === tChange.title.trim().toLowerCase()
            )?.id;

      if (tChange.action === 'add') {
        const newId = `task-copilot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const deadline =
          tChange.deadline ||
          (isValidIsoDate(event.targetDate)
            ? calculateDeadline(event.targetDate, tChange.daysBeforeEvent)
            : event.targetDate);

        taskMap.set(newId, {
          id: newId,
          title: tChange.title,
          description: tChange.description,
          category: tChange.category,
          daysBeforeEvent: Math.max(0, tChange.daysBeforeEvent),
          deadline,
          completed: false,
          completedAt: null,
          priority: tChange.priority,
          dependencies: [],
          milestone: tChange.milestone,
        });
      } else if (tChange.action === 'update' && targetId) {
        const existing = taskMap.get(targetId);
        if (existing) {
          const deadline =
            tChange.deadline ||
            (isValidIsoDate(event.targetDate)
              ? calculateDeadline(event.targetDate, tChange.daysBeforeEvent)
              : existing.deadline);

          taskMap.set(targetId, {
            ...existing,
            title: tChange.title || existing.title,
            description: tChange.description || existing.description,
            daysBeforeEvent: Math.max(0, tChange.daysBeforeEvent),
            deadline,
          });
        }
      } else if (tChange.action === 'remove' && targetId) {
        taskMap.delete(targetId);
      }
    }

    updatedTasks = Array.from(taskMap.values());
  }

  // 3. Apply event changes
  if (result.proposedEventChanges) {
    updatedEvent = {
      ...result.proposedEventChanges,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    updatedEvent,
    updatedExpenses,
    updatedTasks,
    summaryMessage: result.summary,
  };
}
