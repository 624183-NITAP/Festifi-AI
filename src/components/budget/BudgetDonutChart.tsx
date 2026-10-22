'use client';

import React from 'react';
import { PieChart } from 'lucide-react';
import { formatCurrencyMinor } from '@/domain/budget';
import { BudgetCategory, BudgetSummary, EventDetails } from '@/domain/types';

interface BudgetDonutChartProps {
  event: EventDetails;
  budgetSummary: BudgetSummary;
}

export const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  venue: '#f59e0b',
  catering: '#10b981',
  entertainment: '#8b5cf6',
  photography: '#06b6d4',
  decor: '#ec4899',
  attire: '#a855f7',
  invitations: '#3b82f6',
  logistics: '#eab308',
  miscellaneous: '#64748b',
};

export const BudgetDonutChart: React.FC<BudgetDonutChartProps> = ({
  event,
  budgetSummary,
}) => {
  const totalAllocated = budgetSummary.plannedMinor + budgetSummary.confirmedMinor;
  const nonZeroCategories = budgetSummary.categoryBreakdown.filter((c) => c.allocatedMinor > 0);

  let accumulatedAngle = 0;
  const donutSlices = nonZeroCategories.map((cat) => {
    const fraction = totalAllocated > 0 ? cat.allocatedMinor / totalAllocated : 0;
    const angle = fraction * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;

    const x1 = 100 + 70 * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = 100 + 70 * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = 100 + 70 * Math.cos((Math.PI * (startAngle + angle - 90)) / 180);
    const y2 = 100 + 70 * Math.sin((Math.PI * (startAngle + angle - 90)) / 180);

    const largeArc = angle > 180 ? 1 : 0;
    const pathData =
      angle >= 359.9
        ? `M 100 30 A 70 70 0 1 1 99.9 30`
        : `M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return {
      categoryId: cat.categoryId,
      name: cat.categoryName,
      color: CATEGORY_COLORS[cat.categoryId] || '#64748b',
      percentage: ((cat.allocatedMinor / (totalAllocated || 1)) * 100).toFixed(1),
      amount: formatCurrencyMinor(cat.allocatedMinor, event.currency),
      pathData,
    };
  });

  return (
    <section
      className="glass-card"
      style={{ padding: '24px', borderRadius: '18px' }}
      aria-labelledby="budget-breakdown-heading"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <PieChart size={20} color="var(--accent-gold)" aria-hidden="true" />
        <h3 id="budget-breakdown-heading" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
          Category Distribution & Allocations
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'center' }}>
        {/* SVG Donut Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} aria-hidden="true">
          <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(0deg)' }}>
            {donutSlices.length > 0 ? (
              donutSlices.map((slice, idx) => (
                <path
                  key={idx}
                  d={slice.pathData}
                  fill={slice.color}
                  opacity="0.85"
                  stroke="#111827"
                  strokeWidth="2"
                >
                  <title>{`${slice.name}: ${slice.percentage}% (${slice.amount})`}</title>
                </path>
              ))
            ) : (
              <circle cx="100" cy="100" r="70" fill="rgba(255,255,255,0.05)" stroke="var(--border-subtle)" strokeWidth="2" />
            )}
            {/* Inner cutout for donut aesthetic */}
            <circle cx="100" cy="100" r="45" fill="#111827" />
            <text x="100" y="96" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="600">
              COMMITTED
            </text>
            <text x="100" y="112" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">
              {formatCurrencyMinor(totalAllocated, event.currency)}
            </text>
          </svg>
        </div>

        {/* Accessible Table representation of chart */}
        <div className="data-table-container">
          <table className="data-table" aria-label="Category Budget Allocations and Percentages">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Items</th>
                <th scope="col">Allocated</th>
                <th scope="col">% of Budget</th>
              </tr>
            </thead>
            <tbody>
              {budgetSummary.categoryBreakdown.map((cat) => (
                <tr key={cat.categoryId}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: CATEGORY_COLORS[cat.categoryId],
                        display: 'inline-block',
                      }}
                      aria-hidden="true"
                    />
                    <strong>{cat.categoryName}</strong>
                  </td>
                  <td>{cat.itemCount}</td>
                  <td>{formatCurrencyMinor(cat.allocatedMinor, event.currency)}</td>
                  <td>{cat.percentageOfBudget}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
