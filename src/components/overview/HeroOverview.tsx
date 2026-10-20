'use client';

import React from 'react';
import { Calendar, DollarSign, MapPin, Sparkles, Users, ShieldAlert, Utensils, Music, Palette } from 'lucide-react';
import { calculateBudgetSummary, formatCurrencyMinor } from '@/domain/budget';
import { daysBetween, formatDateReadable } from '@/domain/timeline';
import { EventPlanState } from '@/domain/types';

interface HeroOverviewProps {
  state: EventPlanState;
  onNavigateTab: (tabId: string) => void;
}

export const HeroOverview: React.FC<HeroOverviewProps> = ({ state, onNavigateTab }) => {
  const { event, expenses, generatedIdeas } = state;
  const budgetSummary = calculateBudgetSummary(event, expenses);

  const todayIso = new Date().toISOString().split('T')[0];
  const daysRemaining = daysBetween(todayIso, event.targetDate);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Event Hero Banner */}
      <section
        className="glass-card"
        style={{
          padding: '32px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
        aria-labelledby="hero-title"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                {event.type.replace('_', ' ')}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Theme: <strong style={{ color: 'var(--text-primary)' }}>{event.theme}</strong>
              </span>
            </div>

            <h1 id="hero-title" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '12px' }}>
              {event.title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', fontSize: '0.925rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={18} color="var(--accent-gold)" aria-hidden="true" />
                <span>{formatDateReadable(event.targetDate)} ({daysRemaining >= 0 ? `${daysRemaining} days away` : 'Event Concluded'})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={18} color="#38bdf8" aria-hidden="true" />
                <span>{event.guestCount} Guests Confirmed</span>
              </div>
              {event.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={18} color="#f43f5e" aria-hidden="true" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Per-Person Badge */}
          <div
            className="glass-card"
            style={{
              padding: '16px 20px',
              textAlign: 'center',
              borderRadius: '16px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              background: 'rgba(245, 158, 11, 0.05)',
            }}
          >
            <span style={{ fontSize: '0.775rem', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Estimated Per Guest
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {formatCurrencyMinor(budgetSummary.perPersonEstimateMinor, event.currency)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Based on {event.guestCount} guests
            </span>
          </div>
        </div>
      </section>

      {/* KPI Financial Metric Gauges */}
      <section aria-label="Key Financial Metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Total Budget */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Total Available Budget</span>
            <DollarSign size={18} color="var(--accent-gold)" aria-hidden="true" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '8px 0 4px' }}>
            {formatCurrencyMinor(budgetSummary.totalBudgetMinor, event.currency)}
          </div>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Baseline financial ceiling</span>
        </div>

        {/* Confirmed Spending */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Confirmed Contracts</span>
            <span className="badge badge-confirmed">Locked</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', margin: '8px 0 4px' }}>
            {formatCurrencyMinor(budgetSummary.confirmedMinor, event.currency)}
          </div>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Paid to date: {formatCurrencyMinor(budgetSummary.paidMinor, event.currency)}
          </span>
        </div>

        {/* Planned Allocations */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Planned Allocations</span>
            <span className="badge badge-planned">In Progress</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa', margin: '8px 0 4px' }}>
            {formatCurrencyMinor(budgetSummary.plannedMinor, event.currency)}
          </div>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Estimated & quoted items</span>
        </div>

        {/* Contingency Reserve */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Contingency Reserve</span>
            <ShieldAlert size={18} color="var(--accent-gold)" aria-hidden="true" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold)', margin: '8px 0 4px' }}>
            {formatCurrencyMinor(budgetSummary.contingencyReserveMinor, event.currency)}
          </div>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            {event.contingencyPercentage}% protected buffer
          </span>
        </div>

        {/* Remaining / Unallocated */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: '16px',
            border: budgetSummary.isOverBudget ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Unallocated Funds</span>
            {budgetSummary.isOverBudget && <span className="badge badge-must-have">Deficit</span>}
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: budgetSummary.isOverBudget ? '#f87171' : '#38bdf8',
              margin: '8px 0 4px',
            }}
          >
            {formatCurrencyMinor(budgetSummary.unallocatedMinor, event.currency)}
          </div>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            {budgetSummary.isOverBudget ? 'Exceeds budget limit' : 'Available for assignment'}
          </span>
        </div>
      </section>

      {/* AI Personalized Creative Concepts Showcase */}
      {generatedIdeas && (
        <section aria-labelledby="ai-concepts-title" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={22} color="var(--accent-purple)" aria-hidden="true" />
              <h2 id="ai-concepts-title" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
                AI-Personalized Celebration Concepts & Themes
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('optimizer')}
            >
              Run AI Budget Optimizer →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {generatedIdeas.concepts.map((concept, idx) => (
              <div
                key={idx}
                className="glass-card"
                style={{
                  padding: '22px',
                  borderRadius: '16px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {concept.title}
                  </h3>
                  <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
                    {concept.estimatedVibe}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {concept.description}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                  💡 <em>{concept.suitability}</em>
                </div>
              </div>
            ))}
          </div>

          {/* Color Palettes & Menu Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* Color Palettes */}
            <div className="glass-card" style={{ padding: '22px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Palette size={18} color="var(--accent-gold)" aria-hidden="true" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Curated Color Palettes</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {generatedIdeas.themes.map((theme, idx) => (
                  <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {theme.name}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      {theme.colorPalette.map((color, cIdx) => (
                        <div
                          key={cIdx}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: color,
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          }}
                          title={color}
                          aria-label={`Color ${color}`}
                        />
                      ))}
                    </div>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      Decor accents: {theme.decorIdeas.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Menu Highlights */}
            <div className="glass-card" style={{ padding: '22px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Utensils size={18} color="#34d399" aria-hidden="true" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Gourmet Menu Recommendations</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {generatedIdeas.menu.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                        {item.course}: {item.item}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: '#a7f3d0' }}>
                        {item.dietaryNotes}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Entertainment Options */}
            <div className="glass-card" style={{ padding: '22px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Music size={18} color="#f43f5e" aria-hidden="true" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Entertainment & Atmosphere</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {generatedIdeas.entertainment.map((item, idx) => (
                  <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.type}
                      </span>
                      <span className="badge badge-nice-to-have" style={{ fontSize: '0.7rem' }}>
                        {item.estimatedCostTier} tier
                      </span>
                    </div>
                    <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
