import { describe, expect, it } from 'vitest';
import { generateClientProposalPdf } from '@/domain/export/pdfExport';
import { defaultShowcaseGuests } from '@/domain/guests';
import { EventPlanState } from '@/domain/types';

const mockState: EventPlanState = {
  event: {
    id: 'ev-test-proposal',
    title: 'Gala Fundraiser & Botanical Auction',
    type: 'corporate',
    theme: 'Midnight Sapphire & Champagne Sparkle',
    targetDate: '2027-09-20',
    guestCount: 150,
    currency: 'USD',
    totalBudgetMinor: 5000000, // $50,000.00
    contingencyPercentage: 10,
    location: 'Metropolitan Conservatory Pavilion',
    notes: 'Silent auction followed by formal gala dinner',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  expenses: [
    {
      id: 'exp-1',
      categoryId: 'venue',
      name: 'Main Grand Ballroom',
      estimatedCostMinor: 1500000,
      actualCostMinor: 1400000,
      paidMinor: 500000,
      status: 'confirmed',
      priority: 'must_have',
      notes: 'Tables and security included',
    },
    {
      id: 'exp-2',
      categoryId: 'catering',
      name: 'Plated 3-Course Gala Dinner',
      estimatedCostMinor: 2000000,
      actualCostMinor: null,
      paidMinor: 0,
      status: 'planned',
      priority: 'must_have',
      notes: '$133/plate',
    },
    {
      id: 'exp-3',
      categoryId: 'entertainment',
      name: 'Jazz Quartet & Live Auctioneer',
      estimatedCostMinor: 600000,
      actualCostMinor: 600000,
      paidMinor: 600000,
      status: 'paid',
      priority: 'nice_to_have',
      notes: 'Sound equipment included',
    },
  ],
  tasks: [
    {
      id: 't-1',
      title: 'Sign Conservatory Contract',
      description: 'Review venue agreement and pay initial deposit',
      category: 'venue',
      deadline: '2027-03-01',
      daysBeforeEvent: 200,
      completed: true,
      completedAt: '2026-10-15T00:00:00.000Z',
      priority: 'must_have',
      dependencies: [],
      milestone: '6 Months Before',
    },
    {
      id: 't-2',
      title: 'Finalize Catering Menu & Tastings',
      description: 'Confirm selections and wine pairing',
      category: 'catering',
      deadline: '2027-07-01',
      daysBeforeEvent: 80,
      completed: false,
      completedAt: null,
      priority: 'must_have',
      dependencies: [],
      milestone: '3 Months Before',
    },
  ],
  vendors: [
    {
      id: 'v-1',
      name: 'Metropolitan Pavilion',
      category: 'venue',
      contactPerson: 'David Miller',
      email: 'events@metropavilion.com',
      phone: '+1 555-492-0012',
      quotedPriceMinor: 1400000,
      status: 'hired',
      notes: 'Signed contract on file',
    },
  ],
  guests: defaultShowcaseGuests,
  activeProposal: null,
  activeScenarioImpact: null,
  generatedIdeas: {
    concepts: [
      {
        title: 'Midnight Sapphire Gala',
        description: 'Deep navy linens, starlight chandeliers, gold cutlery, and bespoke champagne cocktails.',
        estimatedVibe: 'Sophisticated & Dazzling',
        suitability: 'Ideal for galas and major milestone celebrations.',
      },
    ],
    themes: [
      {
        name: 'Sapphire & Starlight',
        colorPalette: ['#0f172a', '#1e3a8a', '#f59e0b', '#f8fafc'],
        decorIdeas: ['Midnight blue velvet', 'Crystal centerpieces'],
        vibe: 'Opulent evening',
      },
    ],
    menu: [
      { course: 'Entrée', item: 'Prime Rib / Wild Truffle Risotto', dietaryNotes: 'GF / Veg Options', description: 'Gourmet banquet entrée' },
    ],
    entertainment: [
      { type: 'Jazz Quartet', description: 'Classic standards', estimatedCostTier: 'moderate' },
    ],
    recommendedTasks: [],
    recommendedExpenses: [],
    aiAssumptions: ['Estimates benchmarked to regional median.'],
  },
};

describe('Client-Ready PDF Proposal Export Engine', () => {
  it('generates a valid multi-page PDF document for comprehensive event plan', () => {
    const doc = generateClientProposalPdf(mockState);

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

    // Verify raw PDF buffer starts with standard %PDF- header magic bytes
    const pdfData = doc.output();
    expect(pdfData.startsWith('%PDF-')).toBe(true);
  });

  it('generates PDF arraybuffer output suitable for binary export', () => {
    const doc = generateClientProposalPdf(mockState);
    const arrayBuffer = doc.output('arraybuffer');

    expect(arrayBuffer).toBeDefined();
    expect(arrayBuffer.byteLength).toBeGreaterThan(1000);
  });

  it('handles events without optional fields, concepts, or guests gracefully', () => {
    const minimalState: EventPlanState = {
      event: {
        id: 'ev-minimal',
        title: 'Intimate Birthday Dinner',
        type: 'birthday',
        theme: '',
        targetDate: '2027-02-14',
        guestCount: 15,
        currency: 'EUR',
        totalBudgetMinor: 200000,
        contingencyPercentage: 5,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
      expenses: [],
      tasks: [],
      vendors: [],
      guests: [],
      activeProposal: null,
      activeScenarioImpact: null,
      generatedIdeas: null,
    };

    const doc = generateClientProposalPdf(minimalState);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(doc.output().startsWith('%PDF-')).toBe(true);
  });

  it('respects selective section exclusion options', () => {
    const doc = generateClientProposalPdf(mockState, {
      includeConcepts: false,
      includeExpenses: false,
      includeTimeline: false,
      includeGuests: false,
      includeVendors: false,
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
