'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  CloudRain,
  DollarSign,
  HelpCircle,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  X,
} from 'lucide-react';
import { calculateBudgetSummary, formatCurrencyMinor } from '@/domain/budget';
import { calculateDeadline, isValidIsoDate } from '@/domain/timeline';
import {
  CopilotActionType,
  CopilotResult,
  EventDetails,
  ExpenseItem,
  TimelineTask,
} from '@/domain/types';

interface AICopilotModalProps {
  event: EventDetails;
  expenses: ExpenseItem[];
  tasks: TimelineTask[];
  onClose: () => void;
  onApplyChanges: (params: {
    updatedEvent?: Partial<EventDetails>;
    updatedExpenses?: ExpenseItem[];
    updatedTasks?: TimelineTask[];
    summaryMessage: string;
  }) => void;
}

const PRESET_PROMPTS: Array<{
  type: CopilotActionType;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}> = [
  {
    type: 'budget_reduction',
    label: 'Reduce Budget 15%',
    icon: <TrendingDown size={16} color="#f59e0b" />,
    prompt: 'Reduce the total budget by 15% while safeguarding must-haves and confirmed vendors.',
  },
  {
    type: 'preparation_checklist',
    label: '7-Day Prep Checklist',
    icon: <Clock size={16} color="#38bdf8" />,
    prompt: 'Create a prioritized seven-day preparation checklist for the final week before the event.',
  },
  {
    type: 'rain_contingency',
    label: 'Rain Contingency Plan',
    icon: <CloudRain size={16} color="#818cf8" />,
    prompt: 'Add an inclement weather and rain contingency plan with tenting, logistics, and deadlines.',
  },
  {
    type: 'timeline_adjustment',
    label: 'Adjust Event Timeline',
    icon: <Calendar size={16} color="#34d399" />,
    prompt: 'Adjust the event timeline to add safety buffer margins and resolve scheduling compression.',
  },
  {
    type: 'lower_cost_alternatives',
    label: 'Lower-Cost Alternatives',
    icon: <Sparkles size={16} color="#ec4899" />,
    prompt: 'Suggest lower-cost alternatives for top non-essential expenses without hurting guest experience.',
  },
  {
    type: 'realism_audit',
    label: 'Audit Budget & Schedule',
    icon: <ShieldAlert size={16} color="#f43f5e" />,
    prompt: 'Explain why this budget or schedule may be unrealistic and identify hidden risk factors.',
  },
];

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  event,
  expenses,
  tasks,
  onClose,
  onApplyChanges,
}) => {
  const [selectedAction, setSelectedAction] = useState<CopilotActionType>('budget_reduction');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CopilotResult | null>(null);
  const [showConfirmGate, setShowConfirmGate] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const budgetSummary = calculateBudgetSummary(event, expenses);

  const handleRunCopilot = async (actionType: CopilotActionType, promptText: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    setShowConfirmGate(false);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType,
          prompt: promptText,
          event,
          expenses,
          tasks,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `HTTP error ${res.status}`);
      }

      const json = await res.json();
      setResult(json.data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setErrorMessage('Request timed out after 15 seconds. Please try again.');
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Unable to process copilot request. Please check connection and try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyConfirmed = () => {
    if (!result) return;

    let updatedExpenses: ExpenseItem[] | undefined = undefined;
    let updatedTasks: TimelineTask[] | undefined = undefined;
    let updatedEvent: Partial<EventDetails> | undefined = undefined;

    // Apply expense changes
    if (result.proposedExpenseChanges && result.proposedExpenseChanges.length > 0) {
      const expenseMap = new Map(expenses.map((e) => [e.id, e]));

      for (const change of result.proposedExpenseChanges) {
        if (change.action === 'remove' && change.id) {
          expenseMap.delete(change.id);
        } else if (change.action === 'update' && change.id) {
          const existing = expenseMap.get(change.id);
          if (existing) {
            expenseMap.set(change.id, {
              ...existing,
              name: change.name || existing.name,
              categoryId: change.categoryId || existing.categoryId,
              estimatedCostMinor: change.estimatedCostMinor,
              notes: `${existing.notes || ''} [Copilot: ${change.rationale}]`.trim(),
            });
          }
        } else if (change.action === 'add') {
          const newId = `exp-copilot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          expenseMap.set(newId, {
            id: newId,
            categoryId: change.categoryId,
            name: change.name,
            estimatedCostMinor: change.estimatedCostMinor,
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

    // Apply task changes
    if (result.proposedTaskChanges && result.proposedTaskChanges.length > 0) {
      const taskMap = new Map(tasks.map((t) => [t.id, t]));

      for (const tChange of result.proposedTaskChanges) {
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
            daysBeforeEvent: tChange.daysBeforeEvent,
            deadline,
            completed: false,
            completedAt: null,
            priority: tChange.priority,
            dependencies: [],
            milestone: tChange.milestone,
          });
        } else if (tChange.action === 'update' && tChange.id) {
          const existing = taskMap.get(tChange.id);
          if (existing) {
            const deadline =
              tChange.deadline ||
              (isValidIsoDate(event.targetDate)
                ? calculateDeadline(event.targetDate, tChange.daysBeforeEvent)
                : existing.deadline);

            taskMap.set(tChange.id, {
              ...existing,
              title: tChange.title || existing.title,
              description: tChange.description || existing.description,
              daysBeforeEvent: tChange.daysBeforeEvent,
              deadline,
            });
          }
        }
      }

      updatedTasks = Array.from(taskMap.values());
    }

    // Apply event changes
    if (result.proposedEventChanges) {
      updatedEvent = {
        ...result.proposedEventChanges,
        updatedAt: new Date().toISOString(),
      };
    }

    onApplyChanges({
      updatedEvent,
      updatedExpenses,
      updatedTasks,
      summaryMessage: result.summary,
    });

    onClose();
  };

  const hasHighImpactChanges =
    Boolean(result?.proposedExpenseChanges && result.proposedExpenseChanges.length > 0) ||
    Boolean(result?.proposedEventChanges?.totalBudgetMinor !== undefined);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-modal-title"
    >
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '840px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
              }}
              aria-hidden="true"
            >
              <Bot size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 id="copilot-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  AI Event Copilot
                </h3>
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                  Context-Aware
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Intelligent contextual actions tailored for &ldquo;{event.title}&rdquo;
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close AI Copilot modal"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Context Chips */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Preset Contextual Actions
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '10px',
                marginTop: '10px',
              }}
            >
              {PRESET_PROMPTS.map((preset) => {
                const isSelected = selectedAction === preset.type;
                return (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => {
                      setSelectedAction(preset.type);
                      setCustomPrompt(preset.prompt);
                      handleRunCopilot(preset.type, preset.prompt);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isSelected
                        ? '1px solid var(--accent-gold)'
                        : '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                    aria-pressed={isSelected}
                  >
                    {preset.icon}
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Prompt Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customPrompt.trim()) {
                handleRunCopilot('custom', customPrompt.trim());
              }
            }}
            style={{ display: 'flex', gap: '10px' }}
          >
            <input
              type="text"
              className="input-field"
              placeholder="Or ask a custom question (e.g. 'Can we reduce floral budget and reallocate to catering?')..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isLoading}
              style={{ flex: 1 }}
              aria-label="Custom AI Copilot prompt input"
            />
            <button
              type="submit"
              className="btn btn-gold"
              disabled={isLoading || !customPrompt.trim()}
              aria-label="Submit copilot prompt"
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
              <span>Ask</span>
            </button>
          </form>

          {/* Loading State */}
          {isLoading && (
            <div
              className="glass-card"
              style={{
                padding: '36px',
                textAlign: 'center',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
              role="status"
              aria-live="polite"
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  border: '3px solid rgba(245, 158, 11, 0.2)',
                  borderTopColor: 'var(--accent-gold)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <strong style={{ fontSize: '1rem', color: '#ffffff' }}>
                FestiFi AI Copilot is analyzing event context...
              </strong>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '420px' }}>
                Synthesizing current event parameters ({expenses.length} expenses, {tasks.length} tasks) with deterministic validation and market standards.
              </p>
            </div>
          )}

          {/* Error State with Retry */}
          {errorMessage && !isLoading && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
              role="alert"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} color="#f87171" aria-hidden="true" />
                <span style={{ fontSize: '0.875rem', color: '#fca5a5' }}>
                  {errorMessage}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleRunCopilot(selectedAction, customPrompt || PRESET_PROMPTS[0].prompt)}
              >
                <RefreshCw size={14} aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Result Preview */}
          {result && !isLoading && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Provenance Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  fontSize: '0.775rem',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>
                  Engine: <strong style={{ color: '#ffffff' }}>{result.providerName}</strong>
                </span>
                <span className={`badge ${result.isLive ? 'badge-confirmed' : 'badge-planned'}`}>
                  {result.isLive ? 'Live Gemini 2.0 AI' : 'Deterministic Validated Fallback'}
                </span>
              </div>

              {/* Summary Statement */}
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '14px',
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Sparkles size={18} color="var(--accent-gold)" aria-hidden="true" />
                  <strong style={{ fontSize: '0.95rem', color: 'var(--accent-gold)' }}>
                    Copilot Strategic Proposal
                  </strong>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {result.summary}
                </p>
              </div>

              {/* Realism Analysis if present */}
              {result.realismAnalysis && (
                <div
                  className="glass-card"
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <strong style={{ fontSize: '1rem', color: '#ffffff' }}>
                      Feasibility Assessment
                    </strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Score:</span>
                      <span
                        className="badge"
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          background:
                            result.realismAnalysis.feasibilityScore >= 80
                              ? 'rgba(16, 185, 129, 0.2)'
                              : result.realismAnalysis.feasibilityScore >= 55
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(239, 68, 68, 0.2)',
                          color:
                            result.realismAnalysis.feasibilityScore >= 80
                              ? '#34d399'
                              : result.realismAnalysis.feasibilityScore >= 55
                              ? '#fbbf24'
                              : '#f87171',
                        }}
                      >
                        {result.realismAnalysis.feasibilityScore} / 100
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>Budget Critique</span>
                      <ul style={{ margin: '6px 0 0 16px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        {result.realismAnalysis.budgetCritique.map((crit, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>{crit}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>Timeline & Schedule Critique</span>
                      <ul style={{ margin: '6px 0 0 16px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        {result.realismAnalysis.scheduleCritique.map((crit, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>{crit}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Proposed Expense Changes Preview */}
              {result.proposedExpenseChanges && result.proposedExpenseChanges.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>
                    Proposed Budget Adjustments ({result.proposedExpenseChanges.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.proposedExpenseChanges.map((change, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '10px',
                          flexWrap: 'wrap',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.9rem' }}>{change.name}</strong>
                            <span className="badge" style={{ textTransform: 'capitalize' }}>
                              {change.categoryId}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                            {change.rationale}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            className={`badge ${
                              change.deltaMinor < 0
                                ? 'badge-confirmed'
                                : change.deltaMinor > 0
                                ? 'badge-overdue'
                                : ''
                            }`}
                          >
                            {change.deltaMinor < 0 ? '-' : '+'}
                            {formatCurrencyMinor(Math.abs(change.deltaMinor), event.currency)}
                          </span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                            {formatCurrencyMinor(change.estimatedCostMinor, event.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Task Changes Preview */}
              {result.proposedTaskChanges && result.proposedTaskChanges.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>
                    Proposed Task & Timeline Milestones ({result.proposedTaskChanges.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.proposedTaskChanges.map((tChange, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '10px',
                          flexWrap: 'wrap',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.9rem' }}>{tChange.title}</strong>
                            <span className="badge badge-planned">
                              {tChange.milestone}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                            {tChange.description}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {tChange.daysBeforeEvent}d before
                          </span>
                          {tChange.deadline && (
                            <span className="badge badge-pending">
                              {tChange.deadline}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tradeoffs List */}
              {result.tradeoffs && result.tradeoffs.length > 0 && (
                <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Strategic Trade-offs
                  </span>
                  <ul style={{ margin: '6px 0 0 16px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {result.tradeoffs.map((to, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>
                        <strong>{to.item}:</strong> {to.change} — {to.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          {result && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!showConfirmGate ? (
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => {
                    if (hasHighImpactChanges) {
                      setShowConfirmGate(true);
                    } else {
                      handleApplyConfirmed();
                    }
                  }}
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                  <span>Review & Apply to Event</span>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.825rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                    Confirm applying {result.proposedExpenseChanges?.length || 0} expense &amp; {result.proposedTaskChanges?.length || 0} task updates?
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowConfirmGate(false)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-gold btn-sm"
                    onClick={handleApplyConfirmed}
                  >
                    Confirm & Apply
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
