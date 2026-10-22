/**
 * FestiFi AI — Operational Event Readiness Engine
 * Pure mathematical scoring across the 4 key workflow pillars:
 * 1. Timeline & Milestone Execution (30%)
 * 2. Financial Solvency & Budget Health (30%)
 * 3. Guest RSVP Attendance Clarity (20%)
 * 4. Vendor Hiring & Sourcing Progress (20%)
 */

import { calculateBudgetSummary } from '../budget';
import { BudgetSummary, EventPlanState } from '../types';

export type ReadinessStatus = 'optimal' | 'on_track' | 'needs_attention' | 'at_risk';

export interface ReadinessPillarScore {
  score: number; // 0 to 100
  weight: number; // e.g. 0.3
  contribution: number;
  label: string;
}

export interface EventReadiness {
  overallScore: number; // 0 to 100
  status: ReadinessStatus;
  statusLabel: string;
  taskPillar: ReadinessPillarScore;
  budgetPillar: ReadinessPillarScore;
  guestPillar: ReadinessPillarScore;
  vendorPillar: ReadinessPillarScore;
  riskFactors: string[];
}

/**
 * Calculates operational readiness score and pillar breakdown.
 */
export function calculateEventReadiness(
  state: EventPlanState,
  precalculatedSummary?: BudgetSummary,
  referenceDateIso?: string
): EventReadiness {
  const summary = precalculatedSummary ?? calculateBudgetSummary(state.event, state.expenses);

  // 1. Timeline Tasks (30%)
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter((t) => t.completed).length;
  const taskRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // 2. Budget Health (30%)
  // 100 if solvent, 40 if over budget
  const budgetRate = summary.isOverBudget ? 40 : 100;

  // 3. Guest RSVP Progress (20%)
  // Default to 50 if no guests invited yet
  const totalGuests = state.guests?.length || 0;
  const respondedGuests = (state.guests || []).filter((g) => g.rsvpStatus !== 'pending').length;
  const guestRate = totalGuests > 0 ? (respondedGuests / totalGuests) * 100 : 50;

  // 4. Vendor Sourcing Progress (20%)
  // Default to 50 if no vendors listed yet
  const totalVendors = state.vendors.length;
  const hiredVendors = state.vendors.filter((v) => v.status === 'hired').length;
  const vendorRate = totalVendors > 0 ? (hiredVendors / totalVendors) * 100 : 50;

  const taskContrib = taskRate * 0.3;
  const budgetContrib = budgetRate * 0.3;
  const guestContrib = guestRate * 0.2;
  const vendorContrib = vendorRate * 0.2;

  const overallScore = Math.max(0, Math.min(100, Math.round(
    taskContrib + budgetContrib + guestContrib + vendorContrib
  )));

  let status: ReadinessStatus = 'optimal';
  let statusLabel = 'Celebration Ready';

  if (overallScore < 40) {
    status = 'at_risk';
    statusLabel = 'Critical Attention Required';
  } else if (overallScore < 65) {
    status = 'needs_attention';
    statusLabel = 'Action Required';
  } else if (overallScore < 85) {
    status = 'on_track';
    statusLabel = 'On Track';
  }

  const riskFactors: string[] = [];
  if (summary.isOverBudget) {
    riskFactors.push('Committed and planned expenses exceed total budget ceiling.');
  }
  if (totalTasks > 0 && taskRate < 30) {
    riskFactors.push('Less than 30% of scheduled timeline milestones have been completed.');
  }
  if (totalGuests > 0 && guestRate < 50) {
    riskFactors.push('More than 50% of invited guests have not yet responded to RSVP.');
  }
  if (totalVendors > 0 && hiredVendors === 0) {
    riskFactors.push('No primary vendor contracts have been marked as hired.');
  }

  const todayIso = referenceDateIso || new Date().toISOString().split('T')[0];
  const overdueCount = state.tasks.filter(
    (t) => !t.completed && t.deadline && t.deadline < todayIso
  ).length;
  if (overdueCount > 0) {
    riskFactors.push(
      `${overdueCount} timeline milestone${overdueCount === 1 ? ' is' : 's are'} past deadline and incomplete.`
    );
  }

  return {
    overallScore,
    status,
    statusLabel,
    taskPillar: {
      score: Math.round(taskRate),
      weight: 0.3,
      contribution: Math.round(taskContrib),
      label: `${completedTasks}/${totalTasks} Tasks Completed`,
    },
    budgetPillar: {
      score: Math.round(budgetRate),
      weight: 0.3,
      contribution: Math.round(budgetContrib),
      label: summary.isOverBudget ? 'Budget Exceeded' : 'Within Budget Cap',
    },
    guestPillar: {
      score: Math.round(guestRate),
      weight: 0.2,
      contribution: Math.round(guestContrib),
      label: totalGuests > 0 ? `${respondedGuests}/${totalGuests} Responded` : 'No Guests Added',
    },
    vendorPillar: {
      score: Math.round(vendorRate),
      weight: 0.2,
      contribution: Math.round(vendorContrib),
      label: totalVendors > 0 ? `${hiredVendors}/${totalVendors} Hired` : 'No Vendors Added',
    },
    riskFactors,
  };
}
