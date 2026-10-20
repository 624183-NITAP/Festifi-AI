/**
 * FestiFi AI — Event Creation Modal & Asynchronous AI Plan Generation Integration Tests
 *
 * NOTE ON CI EXECUTION:
 * This integration test verifies that the event creation modal initiates an asynchronous request
 * to the server-side /api/ai/plan route, manages loading/error UI states, and propagates the returned
 * plan (recommended expenses, tasks, concepts) into application state. Network calls to /api/ai/plan
 * are explicitly mocked using Vitest spies to ensure fast, deterministic, credential-independent CI runs.
 */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateEventModal } from '@/components/creation/CreateEventModal';
import { GeneratedEventPlan } from '@/domain/types';

describe('Event Creation Modal & Plan Generation Flow (Priority 2 Integration Test)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockGeneratedPlan: GeneratedEventPlan = {
    concepts: [
      {
        title: 'Grand Neon Celebration',
        description: 'Vibrant neon visual celebration',
        estimatedVibe: 'Energetic and luminous',
        suitability: 'High-energy evening celebrations',
      },
    ],
    themes: [
      {
        name: 'Neon Luminescence',
        colorPalette: ['#8b5cf6', '#f59e0b', '#06b6d4'],
        decorIdeas: ['Neon arches', 'LED cocktail lounge'],
        vibe: 'Retro futuristic lighting',
      },
    ],
    menu: [
      {
        course: 'Hors d\'oeuvres',
        item: 'Artisan Mini Sliders',
        dietaryNotes: 'Vegetarian and gluten-free options available',
        description: 'Gourmet handcrafted party bites',
      },
    ],
    entertainment: [
      {
        type: 'Live Jazz Band',
        description: 'Smooth jazz trio for cocktail hour',
        estimatedCostTier: 'moderate',
      },
    ],
    recommendedTasks: [
      {
        title: 'Book Venue Contract',
        description: 'Confirm space and security deposit',
        category: 'venue',
        daysBeforeEvent: 60,
        priority: 'must_have',
        milestone: 'Contract Execution',
      },
      {
        title: 'Finalize Catering Menu',
        description: 'Lock in guest tasting selections',
        category: 'catering',
        daysBeforeEvent: 30,
        priority: 'must_have',
        milestone: 'Vendor Finalization',
      },
    ],
    recommendedExpenses: [
      {
        name: 'Venue Hall Rental',
        categoryId: 'venue',
        estimatedCostMinor: 800000,
        priority: 'must_have',
      },
      {
        name: 'Gourmet Catering Package',
        categoryId: 'catering',
        estimatedCostMinor: 600000,
        priority: 'must_have',
      },
    ],
    aiAssumptions: ['Standard 5-hour reception duration'],
  };

  it('renders creation modal and successfully generates plan via mocked /api/ai/plan endpoint', async () => {
    const handleClose = vi.fn();
    const handleCreateEvent = vi.fn();

    // Mock fetch for /api/ai/plan endpoint (explicitly mocked for reliable CI execution)
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockGeneratedPlan,
        meta: {
          provider: 'Google Gemini 2.0 Flash (Mocked Test)',
          isLive: true,
        },
      }),
    } as Response);

    render(
      <CreateEventModal onClose={handleClose} onCreateEvent={handleCreateEvent} />
    );

    // Verify modal elements
    expect(screen.getByText('Plan a New Celebration')).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /generate & save plan/i });
    expect(submitBtn).toBeInTheDocument();

    // Submit form
    fireEvent.click(submitBtn);

    // Expect fetch to be called with /api/ai/plan
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/ai/plan', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
    });

    // Expect onCreateEvent to be called with populated event details and plan data
    await waitFor(() => {
      expect(handleCreateEvent).toHaveBeenCalledTimes(1);
    });

    const [createdEvent, plan, meta] = handleCreateEvent.mock.calls[0];
    expect(createdEvent.title).toBe('Grand Spring Gala & Celebration');
    expect(createdEvent.guestCount).toBe(150);
    expect(createdEvent.totalBudgetMinor).toBe(2500000); // $25,000.00
    expect(plan.recommendedExpenses).toHaveLength(2);
    expect(plan.recommendedExpenses[0].name).toBe('Venue Hall Rental');
    expect(plan.recommendedTasks).toHaveLength(2);
    expect(plan.recommendedTasks[0].title).toBe('Book Venue Contract');
    expect(meta.isLive).toBe(true);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('displays error state and provides retry and offline demo template fallback on API failure', async () => {
    const handleClose = vi.fn();
    const handleCreateEvent = vi.fn();

    // Mock fetch failure (e.g. HTTP 500 error)
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: 'Simulated AI Service Error',
      }),
    } as Response);

    render(
      <CreateEventModal onClose={handleClose} onCreateEvent={handleCreateEvent} />
    );

    const submitBtn = screen.getByRole('button', { name: /generate & save plan/i });
    fireEvent.click(submitBtn);

    // Wait for error banner
    await waitFor(() => {
      expect(screen.getByText(/AI Plan Generation Notice/i)).toBeInTheDocument();
      expect(screen.getByText(/Simulated AI Service Error/i)).toBeInTheDocument();
    });

    // Verify fallback buttons exist
    const offlineBtn = screen.getByRole('button', { name: /use offline demo template/i });
    const retryBtn = screen.getByRole('button', { name: /retry plan generation/i });
    expect(offlineBtn).toBeInTheDocument();
    expect(retryBtn).toBeInTheDocument();

    // Click offline demo template fallback
    fireEvent.click(offlineBtn);

    await waitFor(() => {
      expect(handleCreateEvent).toHaveBeenCalledTimes(1);
    });

    const [fallbackEvent, fallbackPlan, fallbackMeta] = handleCreateEvent.mock.calls[0];
    expect(fallbackEvent).toBeDefined();
    expect(fallbackPlan.recommendedExpenses.length).toBeGreaterThan(0);
    expect(fallbackPlan.recommendedTasks.length).toBeGreaterThan(0);
    expect(fallbackMeta.isLive).toBe(false);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
