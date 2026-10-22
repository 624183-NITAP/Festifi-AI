'use client';

import React from 'react';
import { CopilotRealismAnalysis } from '@/domain/types';

interface CopilotRealismCardProps {
  analysis: CopilotRealismAnalysis;
}

export const CopilotRealismCard: React.FC<CopilotRealismCardProps> = ({ analysis }) => {
  const getScoreBadgeStyle = (score: number) => {
    if (score >= 80) {
      return { background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' };
    }
    if (score >= 55) {
      return { background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' };
    }
    return { background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' };
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
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
              ...getScoreBadgeStyle(analysis.feasibilityScore),
            }}
          >
            {analysis.feasibilityScore} / 100
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '12px 14px',
            borderRadius: '10px',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>
            Budget Critique
          </span>
          <ul
            style={{
              margin: '6px 0 0 16px',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
            }}
          >
            {analysis.budgetCritique.map((crit, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {crit}
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '12px 14px',
            borderRadius: '10px',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>
            Timeline & Schedule Critique
          </span>
          <ul
            style={{
              margin: '6px 0 0 16px',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
            }}
          >
            {analysis.scheduleCritique.map((crit, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {crit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
