import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { JudgeGuideModal } from '@/components/demo/JudgeGuideModal';
import { Header } from '@/components/navigation/Header';
import { EventDetails } from '@/domain/types';

describe('Guided Judge Demo Mode', () => {
  const mockEvent: EventDetails = {
    id: 'ev-emerald-wedding-2027',
    title: 'Emerald Forest Botanical Wedding',
    type: 'wedding',
    theme: 'Botanical Luxury',
    targetDate: '2027-06-18',
    guestCount: 120,
    currency: 'USD',
    totalBudgetMinor: 3500000,
    contingencyPercentage: 10,
    location: 'Highland Botanical Greenhouse',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  it('renders Header with Judge Guide button and triggers callback', () => {
    const handleOpenJudge = vi.fn();

    render(
      <Header
        event={mockEvent}
        isAiLive={false}
        onOpenCreateModal={vi.fn()}
        onOpenExportModal={vi.fn()}
        onOpenJudgeGuide={handleOpenJudge}
      />
    );

    const judgeButton = screen.getByRole('button', { name: /open guided judge demo mode/i });
    expect(judgeButton).toBeDefined();

    fireEvent.click(judgeButton);
    expect(handleOpenJudge).toHaveBeenCalledTimes(1);
  });

  it('renders JudgeGuideModal with all 6 evaluation tour steps', () => {
    render(
      <JudgeGuideModal
        onClose={vi.fn()}
        onNavigateTab={vi.fn()}
        onOpenCopilot={vi.fn()}
        onOpenExport={vi.fn()}
        onResetShowcase={vi.fn()}
      />
    );

    expect(screen.getByText(/Judge Evaluation & Demo Guide/i)).toBeDefined();
    expect(screen.getByText(/3-Minute Tour/i)).toBeDefined();

    // Verify presence of all 6 evaluation milestones
    expect(screen.getByText(/1\. Inspect Showcase Event/i)).toBeDefined();
    expect(screen.getByText(/2\. Run AI Event Copilot/i)).toBeDefined();
    expect(screen.getByText(/3\. Test 3-Tier Budget Alternatives/i)).toBeDefined();
    expect(screen.getByText(/4\. Audit Operational Workflow/i)).toBeDefined();
    expect(screen.getByText(/5\. Export Client-Ready PDF Proposal/i)).toBeDefined();
    expect(screen.getByText(/6\. Non-Destructive Reset to Showcase/i)).toBeDefined();
  });

  it('triggers onNavigateTab when clicking step 1 action', () => {
    const handleNavigate = vi.fn();
    const handleClose = vi.fn();

    render(
      <JudgeGuideModal
        onClose={handleClose}
        onNavigateTab={handleNavigate}
        onOpenCopilot={vi.fn()}
        onOpenExport={vi.fn()}
        onResetShowcase={vi.fn()}
      />
    );

    const step1Button = screen.getByRole('button', { name: /go to overview tab/i });
    fireEvent.click(step1Button);

    expect(handleNavigate).toHaveBeenCalledWith('overview');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenCopilot when clicking step 2 action', () => {
    const handleCopilot = vi.fn();
    const handleClose = vi.fn();

    render(
      <JudgeGuideModal
        onClose={handleClose}
        onNavigateTab={vi.fn()}
        onOpenCopilot={handleCopilot}
        onOpenExport={vi.fn()}
        onResetShowcase={vi.fn()}
      />
    );

    const step2Button = screen.getByRole('button', { name: /launch ai copilot/i });
    fireEvent.click(step2Button);

    expect(handleCopilot).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers confirmation gate before invoking onResetShowcase', () => {
    const handleReset = vi.fn();
    const handleClose = vi.fn();

    render(
      <JudgeGuideModal
        onClose={handleClose}
        onNavigateTab={vi.fn()}
        onOpenCopilot={vi.fn()}
        onOpenExport={vi.fn()}
        onResetShowcase={handleReset}
      />
    );

    // Initial click on step 6 opens confirmation banner
    const step6Button = screen.getByRole('button', { name: /reset showcase demo/i });
    fireEvent.click(step6Button);

    expect(handleReset).not.toHaveBeenCalled();
    expect(screen.getByText(/Reset Showcase State to Baseline\?/i)).toBeDefined();

    // Confirm button triggers reset and closes modal
    const confirmButton = screen.getByRole('button', { name: /confirm reset/i });
    fireEvent.click(confirmButton);

    expect(handleReset).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
