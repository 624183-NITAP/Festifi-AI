'use client';

import React from 'react';
import { Calendar, Download, Sparkles, PlusCircle } from 'lucide-react';
import { EventDetails } from '@/domain/types';

interface HeaderProps {
  event: EventDetails;
  isAiLive: boolean;
  onOpenCreateModal: () => void;
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  event,
  isAiLive,
  onOpenCreateModal,
  onOpenExportModal,
}) => {
  return (
    <header className="glass-card" style={{ margin: '16px auto', padding: '16px 24px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        {/* Brand & Event Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
            }}
            aria-hidden="true"
          >
            <Sparkles size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fbbf24, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                FestiFi AI
              </span>
              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                PRO
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              GenAI-Powered Celebration & Event Planner
            </p>
          </div>
        </div>

        {/* Status Pill & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* AI Mode Indicator */}
          <div
            className="glass-card"
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              borderRadius: '20px',
            }}
            title={isAiLive ? 'Connected to live Google Gemini API' : 'Running in Deterministic Offline Demo Mode (Zero Credentials Required)'}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isAiLive ? '#10b981' : '#f59e0b',
                boxShadow: isAiLive ? '0 0 10px #10b981' : '0 0 10px #f59e0b',
                display: 'inline-block',
              }}
              aria-hidden="true"
            />
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              AI Engine:
            </span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {isAiLive ? 'Gemini 1.5 Live' : 'Offline Demo Mode'}
            </span>
          </div>

          {/* Export Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenExportModal}
            aria-label="Export Event Plan and Budget"
          >
            <Download size={16} aria-hidden="true" />
            <span>Export Plan</span>
          </button>

          {/* New Event Button */}
          <button
            type="button"
            className="btn btn-gold btn-sm"
            onClick={onOpenCreateModal}
            aria-label="Create or switch event"
          >
            <PlusCircle size={16} aria-hidden="true" />
            <span>New Celebration</span>
          </button>
        </div>
      </div>
    </header>
  );
};
