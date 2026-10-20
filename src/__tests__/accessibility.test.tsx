import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetManager } from '@/components/budget/BudgetManager';
import { Header } from '@/components/navigation/Header';
import { ScenarioSimulator } from '@/components/scenarios/ScenarioSimulator';
import { EventDetails, ExpenseItem } from '@/domain/types';

describe('Accessibility (WCAG 2.2 AA) Component Verification', () => {
  const mockEvent: EventDetails = {
    id: 'ev-a11y-1',
    title: 'Accessible Celebration Gala',
    type: 'wedding',
    theme: 'Emerald Twilight',
    targetDate: '2026-12-25',
    guestCount: 150,
    currency: 'USD',
    totalBudgetMinor: 2500000,
    contingencyPercentage: 10,
    location: 'Winter Garden Ballroom',
    notes: 'Wheelchair accessible ramps required',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const mockExpenses: ExpenseItem[] = [
    {
      id: 'e1',
      categoryId: 'venue',
      name: 'Ballroom Rental',
      estimatedCostMinor: 800000,
      actualCostMinor: 800000,
      paidMinor: 400000,
      status: 'confirmed',
      priority: 'must_have',
    },
    {
      id: 'e2',
      categoryId: 'catering',
      name: 'Multi-Course Dinner',
      estimatedCostMinor: 900000,
      actualCostMinor: null,
      paidMinor: 0,
      status: 'planned',
      priority: 'must_have',
    },
  ];

  it('renders BudgetManager with an accessible tabular alternative for the SVG donut chart', () => {
    render(
      <BudgetManager
        event={mockEvent}
        expenses={mockExpenses}
        onUpdateExpenses={() => {}}
        onOpenOptimizerModal={() => {}}
      />
    );

    // Verify accessible table exists with expected aria-label
    const table = screen.getByRole('table', {
      name: /Category Budget Allocations and Percentages/i,
    });
    expect(table).toBeInTheDocument();

    // Verify interactive action buttons have accessible labels
    const addBtn = screen.getByRole('button', { name: /Add new expense line item/i });
    expect(addBtn).toBeInTheDocument();

    const optBtn = screen.getByRole('button', { name: /Generate AI Budget Optimization Proposal/i });
    expect(optBtn).toBeInTheDocument();
  });

  it('renders Header with semantic header landmark and screen-reader accessible badges', () => {
    render(
      <Header
        event={mockEvent}
        isAiLive={false}
        onOpenCreateModal={() => {}}
        onOpenExportModal={() => {}}
      />
    );

    // Verify landmark
    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();

    // Verify action buttons
    expect(screen.getByRole('button', { name: /Create or switch event/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export Event Plan and Budget/i })).toBeInTheDocument();
  });

  it('renders ScenarioSimulator with status feedback and distinct scenario triggers', () => {
    render(
      <ScenarioSimulator
        event={mockEvent}
        expenses={mockExpenses}
        onApplyScenario={() => {}}
      />
    );

    // Verify main heading
    expect(
      screen.getByRole('heading', { name: /What-If Event Contingency Simulator/i, level: 2 })
    ).toBeInTheDocument();

    // Verify scenario buttons
    expect(screen.getByRole('button', { name: /Surge in Guest Count/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Outdoor Rain/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Critical Vendor Cancellation/i })).toBeInTheDocument();
  });
});
