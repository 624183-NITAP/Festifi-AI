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

  it('generates tailored, professional vendor inquiry messages and checklist safety tips', async () => {
    const provider = new DeterministicDemoAIProvider();
    const inquiry = await provider.generateVendorInquiry(sampleEvent, sampleVendor, 'Need gluten-free menu certification');

    expect(inquiry.isAiGenerated).toBe(true);
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
