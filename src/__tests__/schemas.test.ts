import { beforeEach, describe, expect, it } from 'vitest';
import {
  EventDetailsSchema,
  ExpenseItemSchema,
  IsoDateSchema,
  TimelineTaskSchema,
} from '@/domain/schemas';
import {
  checkRateLimit,
  _resetRateLimitsForTesting,
} from '@/domain/validation/rateLimiter';

describe('Zod Validation Schemas — Hardened Bounds & Datetime Timezone Offsets', () => {
  it('validates ISO dates and enforces mathematical Gregorian leap day correctness', () => {
    // Valid calendar days
    expect(IsoDateSchema.safeParse('2026-11-20').success).toBe(true);
    expect(IsoDateSchema.safeParse('2024-02-29').success).toBe(true); // Leap year
    expect(IsoDateSchema.safeParse('2028-02-29').success).toBe(true); // Leap year

    // Invalid calendar days
    expect(IsoDateSchema.safeParse('2025-02-29').success).toBe(false); // Non-leap year
    expect(IsoDateSchema.safeParse('2026-02-30').success).toBe(false); // Feb 30 does not exist
    expect(IsoDateSchema.safeParse('2026-04-31').success).toBe(false); // April has 30 days
    expect(IsoDateSchema.safeParse('2026-13-01').success).toBe(false); // Invalid month
    expect(IsoDateSchema.safeParse('invalid-date').success).toBe(false);
  });

  it('validates createdAt and updatedAt with ISO timezone offsets (e.g. +05:30, -04:00, Z)', () => {
    const basePayload = {
      id: 'ev-tz-test',
      title: 'Timezone Celebration Gala',
      type: 'wedding',
      theme: 'Sunset Rose',
      targetDate: '2026-11-20',
      guestCount: 150,
      currency: 'USD',
      totalBudgetMinor: 1500000,
      contingencyPercentage: 10,
      location: 'Garden Estate',
      notes: '',
    };

    // UTC with Z
    const utcRes = EventDetailsSchema.safeParse({
      ...basePayload,
      createdAt: '2026-10-20T14:30:00.000Z',
      updatedAt: '2026-10-20T14:30:00.000Z',
    });
    expect(utcRes.success).toBe(true);

    // Timezone offset +05:30 (India Standard Time)
    const istRes = EventDetailsSchema.safeParse({
      ...basePayload,
      createdAt: '2026-10-20T20:00:00.000+05:30',
      updatedAt: '2026-10-20T20:00:00.000+05:30',
    });
    expect(istRes.success).toBe(true);

    // Timezone offset -04:00 (EDT)
    const edtRes = EventDetailsSchema.safeParse({
      ...basePayload,
      createdAt: '2026-10-20T10:30:00.000-04:00',
      updatedAt: '2026-10-20T10:30:00.000-04:00',
    });
    expect(edtRes.success).toBe(true);

    // Invalid datetime string
    const invalidRes = EventDetailsSchema.safeParse({
      ...basePayload,
      createdAt: 'not-a-datetime',
    });
    expect(invalidRes.success).toBe(false);
  });

  it('strictly rejects non-finite numbers (NaN, Infinity) across schemas', () => {
    const expense = {
      id: 'exp-inf',
      categoryId: 'catering',
      name: 'Unlimited Caviar',
      estimatedCostMinor: Infinity,
      actualCostMinor: null,
      paidMinor: 0,
      status: 'planned',
      priority: 'optional',
    };
    expect(ExpenseItemSchema.safeParse(expense).success).toBe(false);

    const expenseNaN = {
      ...expense,
      estimatedCostMinor: NaN,
    };
    expect(ExpenseItemSchema.safeParse(expenseNaN).success).toBe(false);
  });

  it('validates timeline tasks and flags invalid deadlines', () => {
    const validTask = {
      id: 't-1',
      title: 'Book Floral Designer',
      description: 'Review portfolio and secure booking',
      category: 'decor',
      deadline: '2026-11-01',
      daysBeforeEvent: 19,
      completed: false,
      completedAt: null,
      priority: 'must_have',
      dependencies: [],
      milestone: 'Design Lock',
    };
    expect(TimelineTaskSchema.safeParse(validTask).success).toBe(true);

    const invalidTask = {
      ...validTask,
      deadline: '2026-02-30', // invalid leap date
    };
    expect(TimelineTaskSchema.safeParse(invalidTask).success).toBe(false);
  });
});

describe('Token Bucket Rate Limiter — Cache Pruning & Token Depletion', () => {
  beforeEach(() => {
    _resetRateLimitsForTesting();
  });

  it('allows requests within capacity and blocks upon bucket depletion', () => {
    const clientId = 'test-client-1';
    // Consume 3 tokens from capacity 3
    expect(checkRateLimit(clientId, 3, 0.1).allowed).toBe(true);
    expect(checkRateLimit(clientId, 3, 0.1).allowed).toBe(true);
    expect(checkRateLimit(clientId, 3, 0.1).allowed).toBe(true);

    // 4th request must be rate limited
    const blocked = checkRateLimit(clientId, 3, 0.1);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInSeconds).toBeGreaterThan(0);
  });

  it('prunes stale buckets when bucket size exceeds 500 without errors', () => {
    // Populate 510 client buckets
    for (let i = 0; i < 510; i++) {
      checkRateLimit(`client-bulk-${i}`, 10, 1.0);
    }
    // Execution succeeds without throwing or leaking
    const res = checkRateLimit('client-bulk-0', 10, 1.0);
    expect(res).toBeDefined();
  });
});
