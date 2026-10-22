'use client';

import React from 'react';
import { Check, Layers } from 'lucide-react';
import {
  applyBudgetAlternative,
  calculateBudgetSummary,
  formatCurrencyMinor,
  generateBudgetAlternatives,
} from '@/domain/budget';
import { BudgetTier, EventDetails, ExpenseItem } from '@/domain/types';

interface BudgetTierAlternativesProps {
  event: EventDetails;
  expenses: ExpenseItem[];
  selectedTier: BudgetTier;
  onApplyTier: (updatedExpenses: ExpenseItem[], tier: BudgetTier, message: string) => void;
}

export const BudgetTierAlternatives: React.FC<BudgetTierAlternativesProps> = ({
  event,
  expenses,
  selectedTier,
  onApplyTier,
}) => {
  const alternatives = generateBudgetAlternatives(event, expenses);
  const summary = calculateBudgetSummary(event, expenses);
  const tiers: BudgetTier[] = ['economical', 'balanced', 'premium'];

  return (
    <section
      className="glass-card"
      style={{ padding: '24px', borderRadius: '18px' }}
      aria-labelledby="planning-alternatives-heading"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={20} color="var(--accent-gold)" aria-hidden="true" />
          <h3 id="planning-alternatives-heading" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            Planning Alternatives (Economical • Balanced • Premium)
          </h3>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Deterministic financial modeling across 3 tier scopes
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {tiers.map((tKey) => {
          const alt = alternatives[tKey];
          const isSelected = selectedTier === tKey;
          const isBalanced = tKey === 'balanced';
          const isPremium = tKey === 'premium';

          return (
            <div
              key={tKey}
              style={{
                background: isSelected ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: isSelected
                  ? '2px solid var(--accent-gold)'
                  : '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: isSelected ? '0 0 15px rgba(245, 158, 11, 0.2)' : undefined,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span
                    className="badge"
                    style={{
                      background: isBalanced ? 'rgba(56, 189, 248, 0.2)' : isPremium ? 'rgba(192, 132, 252, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: isBalanced ? '#38bdf8' : isPremium ? '#c084fc' : '#34d399',
                      textTransform: 'capitalize',
                    }}
                  >
                    {alt.tier}
                  </span>
                  {isBalanced && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                      RECOMMENDED
                    </span>
                  )}
                </div>

                <strong style={{ fontSize: '1.05rem', color: '#ffffff', display: 'block' }}>
                  {alt.name}
                </strong>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: '4px 0 12px' }}>
                  {alt.subtitle}
                </p>

                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                  {formatCurrencyMinor(alt.totalEstimatedMinor, event.currency)}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Contingency: {formatCurrencyMinor(alt.contingencyReserveMinor, event.currency)}
                </span>

                <ul style={{ margin: '12px 0 0 16px', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  {alt.keyHighlights.map((hl, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{hl}</li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className={`btn ${isSelected ? 'btn-gold' : 'btn-secondary'} btn-sm`}
                onClick={() => {
                  const updated = applyBudgetAlternative(expenses, alt);
                  const message = `Applied ${alt.name} planning alternative to current expenses!`;
                  onApplyTier(updated, tKey, message);
                }}
                style={{ width: '100%' }}
              >
                <Check size={14} aria-hidden="true" />
                <span>{isSelected ? 'Currently Selected' : `Apply ${alt.name}`}</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
