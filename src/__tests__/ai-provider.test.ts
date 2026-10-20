import { describe, expect, it } from 'vitest';
import { DeterministicDemoAIProvider, getAIProvider } from '@/domain/ai';
import { GeneratedEventPlanSchema } from '@/domain/schemas';
import { EventDetails, VendorRecord } from '@/domain/types';

describe('AI Provider Abstraction — Reliability, Offline Demo & Validation', () => {
  const sampleEvent: EventDetails = {
    id: 'ev-ai-1',
    title: 'Emerald Forest Wedding',
    type: 'wedding',
    theme: 'Emerald & Gold Luxury',
    targetDate: '2027-05-18',
    guestCount: 120,
    currency: 'USD',
    totalBudgetMinor: 4000000,
    contingencyPercentage: 10,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const sampleVendor: VendorRecord = {
    id: 'v-1',
    name: 'Artisanal Culinary Co.',
    category: 'catering',
    contactPerson: 'Chef Claire Vance',
    email: 'claire@artisanalculinary.com',
    phone: '+1 555-019-2834',
    quotedPriceMinor: 1200000,
    status: 'contacted',
    notes: 'Inquired about vegan options',
  };

  it('deterministic demo provider generates schema-compliant event plans offline with zero network dependency', async () => {
    const provider = new DeterministicDemoAIProvider();
    expect(provider.isLive).toBe(false);

    const result = await provider.generateEventPlan(sampleEvent);
    expect(result.plan).toBeDefined();
    expect(result.provider).toContain('Deterministic');
    expect(result.isLive).toBe(false);

    // Validate strictly with Zod schema
    const parsed = GeneratedEventPlanSchema.safeParse(result.plan);
    expect(parsed.success).toBe(true);

    expect(result.plan.concepts.length).toBeGreaterThanOrEqual(1);
    expect(result.plan.themes.length).toBeGreaterThanOrEqual(1);
    expect(result.plan.menu.length).toBeGreaterThanOrEqual(1);
    expect(result.plan.entertainment.length).toBeGreaterThanOrEqual(1);
    expect(result.plan.recommendedTasks.length).toBeGreaterThan(0);
    expect(result.plan.recommendedExpenses.length).toBeGreaterThan(0);
  });

  it('generates event plans across diverse celebration types (birthday, community, corporate)', async () => {
    const provider = new DeterministicDemoAIProvider();

    const types: EventDetails['type'][] = ['birthday', 'community', 'corporate', 'other'];

    for (const type of types) {
      const event: EventDetails = {
        ...sampleEvent,
        id: `ev-${type}`,
        type,
        title: `Exciting ${type} Celebration`,
      };
      const res = await provider.generateEventPlan(event);
      expect(GeneratedEventPlanSchema.safeParse(res.plan).success).toBe(true);
    }
  });

  it('generates tailored, professional vendor inquiry messages and checklist safety tips with truthful template flag', async () => {
    const provider = new DeterministicDemoAIProvider();
    const inquiry = await provider.generateVendorInquiry(sampleEvent, sampleVendor, 'Need gluten-free menu certification');

    expect(inquiry.isAiGenerated).toBe(false); // Truthful provenance: template, not live AI
    expect(inquiry.providerName).toContain('Template');
    expect(inquiry.inquiryMessage).toContain('Chef Claire Vance');
    expect(inquiry.inquiryMessage).toContain(sampleEvent.title);
    expect(inquiry.inquiryMessage).toContain('gluten-free');
    expect(inquiry.checklistTips.length).toBeGreaterThanOrEqual(3);
  });

  it('factory function getAIProvider gracefully selects demo provider when credentials are absent', () => {
    delete process.env.GEMINI_API_KEY;
    const provider = getAIProvider();
    expect(provider).toBeDefined();
    expect(provider.isLive).toBe(false);
  });

  it('schema validation strictly rejects incomplete or malformed AI outputs', () => {
    const malformed = {
      concepts: [], // Must have at least 1
      themes: [],
    };
    const check = GeneratedEventPlanSchema.safeParse(malformed);
    expect(check.success).toBe(false);
  });
});

describe('GeminiAIProvider (Mocked Network Unit Tests)', () => {
  const sampleEvent: EventDetails = {
    id: 'ev-gemini-test',
    title: 'Starry Gala',
    type: 'corporate',
    theme: 'Midnight Sky',
    targetDate: '2027-09-20',
    guestCount: 200,
    currency: 'USD',
    totalBudgetMinor: 5000000,
    contingencyPercentage: 10,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const validPlanResponse = {
    concepts: [{ title: 'Cosmic Constellation', description: 'Deep indigo lighting and floating crystal centerpieces', estimatedVibe: 'Sleek & Futuristic', suitability: 'Ideal for tech corporate galas' }],
    themes: [{ name: 'Starlight Navy & Silver', colorPalette: ['#0B192C', '#1E3E62', '#E1E1E1', '#FFFFFF'], decorIdeas: ['Fiber-optic ceiling canopy'], vibe: 'Futuristic Elegance' }],
    menu: [{ course: 'Dinner', item: 'Glazed Salmon Fillet', dietaryNotes: 'Gluten-Free', description: 'Fresh wild-caught salmon with lemon glaze' }],
    entertainment: [{ type: 'Electric Violinist Trio', description: 'Contemporary high-energy instrumental set', estimatedCostTier: 'moderate' as const }],
    recommendedTasks: [{ title: 'Secure Lighting Contractor', description: 'Confirm specialized ambient rigging', category: 'decor' as const, daysBeforeEvent: 60, priority: 'must_have' as const, milestone: 'Vendor Lock' }],
    recommendedExpenses: [{ categoryId: 'decor' as const, name: 'Ambient Rigging & Uplighting', estimatedCostMinor: 450000, priority: 'must_have' as const }],
    aiAssumptions: ['Based on 200 corporate attendees'],
  };

  it('successfully returns live AI plan when API returns valid structured JSON', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(validPlanResponse) }],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    try {
      const { GeminiAIProvider } = await import('@/domain/ai');
      const provider = new GeminiAIProvider('test-api-key-12345', 'gemini-2.0-flash');
      expect(provider.model).toBe('gemini-2.0-flash');
      expect(provider.name).toBe('Google Gemini (gemini-2.0-flash)');

      const result = await provider.generateEventPlan(sampleEvent);
      expect(result.isLive).toBe(true);
      expect(result.provider).toBe('Google Gemini (gemini-2.0-flash)');
      expect(result.plan.concepts[0].title).toBe('Cosmic Constellation');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('gracefully falls back with truthful fallback provenance when model output is malformed', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: '{ "notAValidPlan": true }' }],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    try {
      const { GeminiAIProvider } = await import('@/domain/ai');
      const provider = new GeminiAIProvider('test-api-key-12345');
      const result = await provider.generateEventPlan(sampleEvent);

      expect(result.isLive).toBe(false); // Truthful provenance: fallback ran!
      expect(result.provider).toContain('Fallback');
      expect(result.plan).toBeDefined();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('gracefully falls back when API returns HTTP non-2xx status', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response('Resource Exhausted (Rate Limit)', { status: 429 });

    try {
      const { GeminiAIProvider } = await import('@/domain/ai');
      const provider = new GeminiAIProvider('test-api-key-12345');
      const result = await provider.generateEventPlan(sampleEvent);

      expect(result.isLive).toBe(false);
      expect(result.provider).toContain('HTTP 429');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('gracefully falls back when network request times out or aborts', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    };

    try {
      const { GeminiAIProvider } = await import('@/domain/ai');
      const provider = new GeminiAIProvider('test-api-key-12345');
      const result = await provider.generateEventPlan(sampleEvent);

      expect(result.isLive).toBe(false);
      expect(result.provider).toContain('Fallback: Error Encountered');
      expect(result.plan).toBeDefined();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('falls back immediately when initialized with empty API key', async () => {
    const { GeminiAIProvider } = await import('@/domain/ai');
    const provider = new GeminiAIProvider('');
    const result = await provider.generateEventPlan(sampleEvent);

    expect(result.isLive).toBe(false);
    expect(result.provider).toContain('Missing API Key');
    expect(result.plan).toBeDefined();
  });
});

