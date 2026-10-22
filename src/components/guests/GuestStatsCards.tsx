'use client';

import React from 'react';
import { Clock, UserCheck, Users, Utensils } from 'lucide-react';
import { GuestStats } from '@/domain/guests';

interface GuestStatsCardsProps {
  stats: GuestStats;
  targetCapacity: number;
}

export const GuestStatsCards: React.FC<GuestStatsCardsProps> = ({
  stats,
  targetCapacity,
}) => {
  const specialMealsCount = Object.entries(stats.dietaryBreakdown)
    .filter(([key, count]) => key !== 'none' && count > 0)
    .reduce((acc, [, c]) => acc + c, 0);

  return (
    <section
      aria-label="Guest RSVP Statistics"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}
    >
      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
          <span>Total Invited</span>
          <Users size={18} color="#94a3b8" aria-hidden="true" />
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '6px 0 2px' }}>
          {stats.totalInvited}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Target: {targetCapacity} capacity
        </span>
      </div>

      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
          <span>Confirmed Attending</span>
          <UserCheck size={18} color="#34d399" aria-hidden="true" />
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', margin: '6px 0 2px' }}>
          {stats.attending}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          +{stats.plusOnesCount} plus-ones = {stats.totalExpectedHeadcount} total seats
        </span>
      </div>

      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
          <span>Awaiting RSVP</span>
          <Clock size={18} color="#f59e0b" aria-hidden="true" />
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', margin: '6px 0 2px' }}>
          {stats.pending}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Response rate: {stats.responseRatePercentage}%
        </span>
      </div>

      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
          <span>Dietary Restrictions</span>
          <Utensils size={18} color="#ec4899" aria-hidden="true" />
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ec4899', margin: '6px 0 2px' }}>
          {specialMealsCount}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Special meals required
        </span>
      </div>
    </section>
  );
};
