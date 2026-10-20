'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, DollarSign, ShieldCheck, XCircle } from 'lucide-react';
import { formatCurrencyMinor } from '@/domain/budget';
import { BudgetOptimizationProposal, EventDetails } from '@/domain/types';

interface BudgetOptimizerModalProps {
  event: EventDetails;
  proposal: BudgetOptimizationProposal;
  onAccept: () => void;
  onReject: () => void;
}

export const BudgetOptimizerModal: React.FC<BudgetOptimizerModalProps> = ({
  event,
  proposal,
  onAccept,
  onReject,
}) => {
  const { summaryBefore, summaryAfter, tradeoffs, rationale } = proposal;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="optimizer-modal-title">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '780px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            <DollarSign size={22} color="#ffffff" />
          </div>
          <div>
            <h3 id="optimizer-modal-title" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              AI Budget Optimization Proposal
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Deterministic prioritization protecting confirmed contracts & must-have experiences.
            </p>
          </div>
        </div>

        {/* Rationale Box */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '14px 18px',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            marginBottom: '20px',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '4px' }}>
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Optimization Strategy</span>
          </div>
          {rationale}
        </div>

        {/* Before and After Comparison Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '22px',
          }}
        >
          {/* Before */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
              Current Plan (Before)
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: summaryBefore.isOverBudget ? '#f87171' : 'var(--text-primary)', marginTop: '4px' }}>
              {formatCurrencyMinor(summaryBefore.plannedMinor + summaryBefore.confirmedMinor, event.currency)}
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Unallocated: {formatCurrencyMinor(summaryBefore.unallocatedMinor, event.currency)}
            </div>
          </div>

          <ArrowRight size={22} color="var(--accent-gold)" aria-hidden="true" />

          {/* After */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6ee7b7', fontWeight: 700 }}>
              Optimized Proposal (After)
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
              {formatCurrencyMinor(summaryAfter.plannedMinor + summaryAfter.confirmedMinor, event.currency)}
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Unallocated: {formatCurrencyMinor(summaryAfter.unallocatedMinor, event.currency)}
            </div>
          </div>
        </div>

        {/* Itemized Trade-Offs */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>
          Recommended Adjustments & Trade-Offs ({tradeoffs.length})
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', marginBottom: '24px' }}>
          {tradeoffs.map((t, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{t.item}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', marginLeft: '8px' }}>
                  ({t.change})
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {t.reason}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 700, color: '#34d399', fontSize: '0.9rem' }}>
                  +{formatCurrencyMinor(t.savingsMinor, event.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Explicit Approval Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onReject}
            aria-label="Reject optimization proposal and keep original budget"
          >
            <XCircle size={18} aria-hidden="true" />
            <span>Reject Proposal</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onAccept}
            aria-label="Accept and apply optimization proposal to budget"
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Accept & Apply Optimization</span>
          </button>
        </div>
      </div>
    </div>
  );
};
