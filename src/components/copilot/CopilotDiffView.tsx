'use client';

import React from 'react';
import { formatCurrencyMinor } from '@/domain/budget';
import {
  CopilotExpenseChange,
  CopilotTaskChange,
  CurrencyCode,
  ScenarioTradeoff,
} from '@/domain/types';

interface CopilotDiffViewProps {
  proposedExpenseChanges?: CopilotExpenseChange[];
  proposedTaskChanges?: CopilotTaskChange[];
  tradeoffs?: ScenarioTradeoff[];
  currency: CurrencyCode;
}

export const CopilotDiffView: React.FC<CopilotDiffViewProps> = ({
  proposedExpenseChanges,
  proposedTaskChanges,
  tradeoffs,
  currency,
}) => {
  return (
    <>
      {/* Proposed Expense Changes Preview */}
      {proposedExpenseChanges && proposedExpenseChanges.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>
            Proposed Budget Adjustments ({proposedExpenseChanges.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {proposedExpenseChanges.map((change, idx) => (
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
                    {formatCurrencyMinor(Math.abs(change.deltaMinor), currency)}
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                    {formatCurrencyMinor(change.estimatedCostMinor, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposed Task Changes Preview */}
      {proposedTaskChanges && proposedTaskChanges.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>
            Proposed Task & Timeline Milestones ({proposedTaskChanges.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {proposedTaskChanges.map((tChange, idx) => (
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
      {tradeoffs && tradeoffs.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Strategic Trade-offs
          </span>
          <ul style={{ margin: '6px 0 0 16px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            {tradeoffs.map((to, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                <strong>{to.item}:</strong> {to.change} — {to.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};
