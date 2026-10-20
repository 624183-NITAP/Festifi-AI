/**
 * FestiFi AI — Persistence & Export Engine
 * Secure, client-isolated storage with localStorage resilience, in-memory fallback,
 * and high-fidelity multi-format data export (JSON, CSV, Accessible Markdown Report).
 */

import { calculateBudgetSummary, formatCurrencyMinor } from '../budget';
import { CurrencyCode, EventPlanState, ExpenseItem } from '../types';

const STORAGE_KEY_PREFIX = 'festifi_event_';
const ACTIVE_EVENT_KEY = 'festifi_active_event_id';

// In-memory fallback if localStorage is disabled or running in test/SSR
const inMemoryStore = new Map<string, string>();

function getStorageItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return inMemoryStore.get(key) || null;
    }
  }
  return inMemoryStore.get(key) || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      // Fallback to in-memory on storage quota exceeded or disabled
    }
  }
  inMemoryStore.set(key, value);
}

function removeStorageItem(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }
  inMemoryStore.delete(key);
}

/**
 * Persists an event plan state to storage.
 */
export function saveEventPlanState(state: EventPlanState): void {
  const serialized = JSON.stringify(state);
  setStorageItem(`${STORAGE_KEY_PREFIX}${state.event.id}`, serialized);
  setStorageItem(ACTIVE_EVENT_KEY, state.event.id);
}

/**
 * Retrieves the event plan state by event ID.
 */
export function loadEventPlanState(eventId: string): EventPlanState | null {
  const data = getStorageItem(`${STORAGE_KEY_PREFIX}${eventId}`);
  if (!data) return null;
  try {
    return JSON.parse(data) as EventPlanState;
  } catch {
    return null;
  }
}

/**
 * Gets the most recently active event plan state.
 */
export function loadActiveEventPlanState(): EventPlanState | null {
  const activeId = getStorageItem(ACTIVE_EVENT_KEY);
  if (!activeId) return null;
  return loadEventPlanState(activeId);
}

/**
 * Removes an event plan state.
 */
export function deleteEventPlanState(eventId: string): void {
  removeStorageItem(`${STORAGE_KEY_PREFIX}${eventId}`);
  const activeId = getStorageItem(ACTIVE_EVENT_KEY);
  if (activeId === eventId) {
    removeStorageItem(ACTIVE_EVENT_KEY);
  }
}

/**
 * Exports complete event state to pristine, formatted JSON.
 */
export function exportStateToJson(state: EventPlanState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Exports event expenses to standard RFC 4180 CSV format.
 */
export function exportExpensesToCsv(expenses: ExpenseItem[], currency: CurrencyCode = 'USD'): string {
  const headers = ['Category', 'Item Name', 'Priority', 'Status', 'Estimated Cost', 'Actual Cost', 'Paid', 'Notes'];

  const rows = expenses.map((item) => {
    const estimatedStr = (item.estimatedCostMinor / 100).toFixed(2);
    const actualStr = item.actualCostMinor !== null ? (item.actualCostMinor / 100).toFixed(2) : '';
    const paidStr = (item.paidMinor / 100).toFixed(2);

    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

    return [
      escapeCsv(item.categoryId || ''),
      escapeCsv(item.name || ''),
      escapeCsv(item.priority || ''),
      escapeCsv(item.status || ''),
      estimatedStr,
      actualStr,
      paidStr,
      escapeCsv(item.notes || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates an accessible, printable executive Markdown report for the event plan.
 */
export function exportToMarkdownSummary(state: EventPlanState): string {
  const { event, expenses, tasks } = state;
  const summary = calculateBudgetSummary(event, expenses);
  const completedTasks = tasks.filter((t) => t.completed).length;

  return [
    `# FestiFi AI — Event Planning & Executive Summary`,
    ``,
    `**Event Title:** ${event.title}`,
    `**Event Type:** ${event.type.toUpperCase()}`,
    `**Target Date:** ${event.targetDate}`,
    `**Guest Count:** ${event.guestCount}`,
    `**Total Budget:** ${formatCurrencyMinor(event.totalBudgetMinor, event.currency)}`,
    `**Contingency Reserve (${event.contingencyPercentage}%):** ${formatCurrencyMinor(summary.contingencyReserveMinor, event.currency)}`,
    ``,
    `---`,
    ``,
    `## Budget Overview`,
    `- Total Planned Allocations: ${formatCurrencyMinor(summary.plannedMinor, event.currency)}`,
    `- Confirmed Commitments: ${formatCurrencyMinor(summary.confirmedMinor, event.currency)}`,
    `- Total Disbursed / Paid: ${formatCurrencyMinor(summary.paidMinor, event.currency)}`,
    `- Unallocated Funds: ${formatCurrencyMinor(summary.unallocatedMinor, event.currency)}`,
    `- Remaining Balance: ${formatCurrencyMinor(summary.remainingMinor, event.currency)}`,
    ``,
    `### Itemized Expenses (${expenses.length} items)`,
    `| Category | Item | Priority | Status | Cost | Paid |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- |`,
    ...expenses.map(
      (e) => `| ${e.categoryId} | ${e.name} | ${e.priority} | ${e.status} | ${formatCurrencyMinor(e.estimatedCostMinor, event.currency)} | ${formatCurrencyMinor(e.paidMinor, event.currency)} |`
    ),
    ``,
    `---`,
    ``,
    `## Timeline Progress (${completedTasks}/${tasks.length} Completed)`,
    `| Deadline | Task | Category | Status |`,
    `| :--- | :--- | :--- | :--- |`,
    ...tasks.map(
      (t) => `| ${t.deadline} | ${t.title} | ${t.category} | ${t.completed ? '✅ Done' : '⏳ Pending'} |`
    ),
    ``,
    `Generated securely by FestiFi AI on ${new Date().toISOString()}`,
  ].join('\n');
}
