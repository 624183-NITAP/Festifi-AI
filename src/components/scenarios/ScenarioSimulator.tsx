'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CloudRain,
  DollarSign,
  TrendingUp,
  UserX,
  Users,
  UtensilsCrossed,
  RotateCcw,
} from 'lucide-react';
import { formatCurrencyMinor } from '@/domain/budget';
import { SCENARIO_DEFINITIONS, applyScenarioAdjustments, simulateScenario } from '@/domain/scenarios';
import { EventDetails, ExpenseItem, ScenarioImpact, ScenarioType } from '@/domain/types';

interface ScenarioSimulatorProps {
  event: EventDetails;
  expenses: ExpenseItem[];
  onApplyScenario: (newExpenses: ExpenseItem[]) => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  event,
  expenses,
  onApplyScenario,
}) => {
  const [selectedType, setSelectedType] = useState<ScenarioType>('guest_count_change');
  const [activeImpact, setActiveImpact] = useState<ScenarioImpact | null>(() =>
    simulateScenario(event, expenses, 'guest_count_change')
  );
  const [notification, setNotification] = useState<string | null>(null);

  const handleSelectScenario = (type: ScenarioType) => {
    setSelectedType(type);
    const impact = simulateScenario(event, expenses, type);
    setActiveImpact(impact);
    setNotification(null);
  };

  const handleApply = () => {
    if (!activeImpact) return;
    const updated = applyScenarioAdjustments(expenses, activeImpact);
    onApplyScenario(updated);
    setNotification(`Successfully applied scenario "${activeImpact.title}" to active event plan!`);
  };

  const handleDiscard = () => {
    setActiveImpact(null);
    setNotification('Simulation discarded. Active event plan remained completely untouched.');
  };

  const getScenarioIcon = (type: ScenarioType) => {
    switch (type) {
      case 'guest_count_change':
        return <Users size={22} color="#38bdf8" aria-hidden="true" />;
      case 'budget_reduction':
        return <TrendingUp size={22} color="#f59e0b" aria-hidden="true" />;
      case 'rain_contingency':
        return <CloudRain size={22} color="#818cf8" aria-hidden="true" />;
      case 'vendor_cancellation':
        return <UserX size={22} color="#f87171" aria-hidden="true" />;
      case 'date_change':
        return <Calendar size={22} color="#34d399" aria-hidden="true" />;
      case 'dietary_requirements':
        return <UtensilsCrossed size={22} color="#ec4899" aria-hidden="true" />;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
          What-If Event Contingency Simulator
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Stress-test your celebration against real-world volatility with deterministic financial modeling.
        </p>
      </div>

      {notification && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#6ee7b7',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          role="status"
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{notification}</span>
        </div>
      )}

      {/* Scenario Selection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        {(Object.keys(SCENARIO_DEFINITIONS) as ScenarioType[]).map((type) => {
          const isSelected = selectedType === type;
          const def = SCENARIO_DEFINITIONS[type];

          return (
            <button
              key={type}
              type="button"
              className="glass-card"
              onClick={() => handleSelectScenario(type)}
              style={{
                padding: '18px',
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: '16px',
                border: isSelected
                  ? '2px solid var(--accent-gold)'
                  : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-card)',
                boxShadow: isSelected ? 'var(--shadow-glow-gold)' : undefined,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
              aria-pressed={isSelected}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getScenarioIcon(type)}
                </div>
                <strong style={{ fontSize: '0.95rem', color: isSelected ? 'var(--accent-gold)' : '#ffffff' }}>
                  {def.title}
                </strong>
              </div>
              <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {def.defaultDescription}
              </p>
            </button>
          );
        })}
      </div>

      {/* Simulation Result Panel */}
      {activeImpact && (
        <section
          className="glass-card animate-fade-in"
          style={{
            padding: '28px',
            borderRadius: '20px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.4) 100%)',
          }}
          aria-labelledby="simulation-results-heading"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span
                  className="badge"
                  style={{
                    background:
                      activeImpact.riskLevel === 'high'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : activeImpact.riskLevel === 'medium'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(16, 185, 129, 0.2)',
                    color:
                      activeImpact.riskLevel === 'high'
                        ? '#fca5a5'
                        : activeImpact.riskLevel === 'medium'
                        ? '#fde047'
                        : '#6ee7b7',
                  }}
                >
                  {activeImpact.riskLevel} Risk Severity
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Categories: {activeImpact.affectedCategories.join(', ')}
                </span>
              </div>

              <h3 id="simulation-results-heading" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                {activeImpact.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {activeImpact.description}
              </p>
            </div>

            {/* Impact Metric Box */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '14px 20px',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Projected Cost Delta
              </span>
              <div
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: activeImpact.costDeltaMinor > 0 ? '#f87171' : '#34d399',
                  marginTop: '4px',
                }}
              >
                {activeImpact.costDeltaMinor > 0 ? '+' : ''}
                {formatCurrencyMinor(activeImpact.costDeltaMinor, event.currency)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Contingency buffer absorbed: {formatCurrencyMinor(activeImpact.contingencyImpactMinor, event.currency)}
              </span>
            </div>
          </div>

          {/* Itemized Proposed Adjustments */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
              Deterministic Cost Adjustments & Impact Breakdown
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeImpact.proposedAdjustments.map((adj, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{adj.description}</span>
                  <strong
                    style={{
                      fontSize: '0.925rem',
                      color: adj.costDeltaMinor > 0 ? '#f87171' : '#34d399',
                    }}
                  >
                    {adj.costDeltaMinor > 0 ? '+' : ''}
                    {formatCurrencyMinor(adj.costDeltaMinor, event.currency)}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* Expert Mitigation Recommendations */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', color: 'var(--accent-gold)' }}>
              Actionable Risk Mitigations & Strategy
            </h4>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {activeImpact.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* Action Buttons: Explicit user approval required */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDiscard}
              aria-label="Discard scenario simulation and keep original plan"
            >
              <RotateCcw size={16} aria-hidden="true" />
              <span>Discard Simulation</span>
            </button>

            <button
              type="button"
              className="btn btn-gold"
              onClick={handleApply}
              aria-label="Apply scenario changes to active event expenses"
            >
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>Apply Scenario to Plan</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
