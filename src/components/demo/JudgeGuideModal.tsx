'use client';

import React, { useState } from 'react';
import {
  Award,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Download,
  RotateCcw,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

interface JudgeGuideModalProps {
  onClose: () => void;
  onNavigateTab: (tab: 'overview' | 'budget' | 'scenarios' | 'timeline' | 'vendors' | 'guests') => void;
  onOpenCopilot: () => void;
  onOpenExport: () => void;
  onResetShowcase: () => void;
}

export const JudgeGuideModal: React.FC<JudgeGuideModalProps> = ({
  onClose,
  onNavigateTab,
  onOpenCopilot,
  onOpenExport,
  onResetShowcase,
}) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber) ? prev.filter((s) => s !== stepNumber) : [...prev, stepNumber]
    );
  };

  const steps = [
    {
      id: 1,
      title: '1. Inspect Showcase Event & Readiness Score',
      category: 'Overview & Architecture',
      description:
        'Explore the default "Emerald Forest Botanical Wedding" celebration. Notice the 4-pillar Operational Readiness Score (0–100%) tracking Budget solvency, Timeline milestones, RSVPs, and Vendor hiring.',
      actionLabel: 'Go to Overview Tab',
      icon: <Sparkles size={18} color="var(--accent-gold)" aria-hidden="true" />,
      runAction: () => {
        onNavigateTab('overview');
        onClose();
      },
    },
    {
      id: 2,
      title: '2. Run AI Event Copilot with Side-by-Side Diff',
      category: 'Generative AI & Governance',
      description:
        'Launch the AI Copilot to run contextual operations like "Reduce Budget by 15%", "Rain Contingency", or "Realism Audit". Inspect the side-by-side financial diff before applying changes.',
      actionLabel: 'Launch AI Copilot',
      icon: <Bot size={18} color="#ec4899" aria-hidden="true" />,
      runAction: () => {
        onClose();
        onOpenCopilot();
      },
    },
    {
      id: 3,
      title: '3. Test 3-Tier Budget Alternatives',
      category: 'Financial Engineering',
      description:
        'Navigate to the Smart Budget tab. Test the 3 Planning Alternatives: Economical (-18% with smart catering trade-offs), Balanced (-10%), or Premium (+12%). Notice exact integer minor currency cents arithmetic.',
      actionLabel: 'Open Smart Budget',
      icon: <DollarSign size={18} color="#10b981" aria-hidden="true" />,
      runAction: () => {
        onNavigateTab('budget');
        onClose();
      },
    },
    {
      id: 4,
      title: '4. Audit Operational Workflow & RSVPs',
      category: 'Operational Event Execution',
      description:
        'Visit the Guest List & RSVPs tab. Toggle an RSVP between Attending, Declined, and Pending. Notice how attending plus-ones recalculate confirmed seats and update the chef dietary catering matrix in real time.',
      actionLabel: 'Open Guest & RSVP Manager',
      icon: <Users size={18} color="#38bdf8" aria-hidden="true" />,
      runAction: () => {
        onNavigateTab('guests');
        onClose();
      },
    },
    {
      id: 5,
      title: '5. Export Client-Ready PDF Proposal',
      category: 'Deliverables & Export Engine',
      description:
        'Open the Export Center and click "Executive Client Proposal (PDF)". Inspect the publication-grade layout with cover header, financial schedule, chef dietary matrix, and governance disclaimers.',
      actionLabel: 'Open Export Center',
      icon: <Download size={18} color="var(--accent-gold)" aria-hidden="true" />,
      runAction: () => {
        onClose();
        onOpenExport();
      },
    },
    {
      id: 6,
      title: '6. Non-Destructive Reset to Showcase',
      category: 'Resilience & Clean State',
      description:
        'Restore the pristine Emerald Forest Botanical Wedding showcase state at any time for repeatable testing. User custom events in localStorage remain isolated and protected.',
      actionLabel: 'Reset Showcase Demo',
      icon: <RotateCcw size={18} color="#94a3b8" aria-hidden="true" />,
      runAction: () => {
        setConfirmReset(true);
      },
    },
  ];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="judge-guide-title">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Award size={22} color="#38bdf8" aria-hidden="true" />
              <h3 id="judge-guide-title" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                Judge Evaluation & Demo Guide
              </h3>
              <span
                className="badge"
                style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  fontSize: '0.75rem',
                }}
              >
                3-Minute Tour
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Follow these 6 steps to evaluate FestiFi AI’s event intelligence, deterministic arithmetic, and generative workflows.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close Judge Evaluation Guide"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Evaluation Tour Progress: <strong style={{ color: '#ffffff' }}>{completedSteps.length} of {steps.length} Verified</strong>
          </span>
          <div
            style={{
              height: '8px',
              width: '140px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(completedSteps.length / steps.length) * 100}%`,
                background: 'linear-gradient(to right, #38bdf8, #8b5cf6)',
                borderRadius: '8px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Confirm Reset Dialog */}
        {confirmReset && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>
              Reset Showcase State to Baseline?
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              This will reload the initial Emerald Forest Botanical Wedding data (default expenses, tasks, guests, and vendors).
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: '#dc2626', color: '#ffffff' }}
                onClick={() => {
                  onResetShowcase();
                  setConfirmReset(false);
                  onClose();
                }}
              >
                Confirm Reset
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {steps.map((step) => {
            const isDone = completedSteps.includes(step.id);
            return (
              <div
                key={step.id}
                style={{
                  background: isDone ? 'rgba(56, 189, 248, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                  border: isDone ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      aria-label={isDone ? `Mark step ${step.id} incomplete` : `Mark step ${step.id} completed`}
                    >
                      <CheckCircle2
                        size={20}
                        color={isDone ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'}
                        aria-hidden="true"
                      />
                    </button>
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: isDone ? '#ffffff' : 'var(--text-primary)' }}>
                        {step.title}
                      </strong>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        [{step.category}]
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {step.icon}
                  </div>
                </div>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', paddingLeft: '30px' }}>
                  {step.description}
                </p>

                <div style={{ paddingLeft: '30px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (!isDone) toggleStep(step.id);
                      step.runAction();
                    }}
                    style={{
                      fontSize: '0.8rem',
                      padding: '4px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{step.actionLabel}</span>
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            FestiFi AI Competition-Ready Upgrade • Zero Credentials Required in Offline Demo Mode
          </span>
          <button type="button" className="btn btn-gold btn-sm" onClick={onClose}>
            Close Tour
          </button>
        </div>
      </div>
    </div>
  );
};
