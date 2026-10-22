import { describe, expect, it } from 'vitest';
import { calculateGuestStats, defaultShowcaseGuests, DIETARY_LABELS } from '@/domain/guests';
import { GuestRecordSchema } from '@/domain/schemas';
import { GuestRecord } from '@/domain/types';

describe('Operational Workflow — Guest & RSVP Management', () => {
  it('correctly validates valid GuestRecord via Zod schema', () => {
    const validGuest: GuestRecord = {
      id: 'g-101',
      fullName: 'Charlotte Bronte',
      email: 'charlotte@example.com',
      phone: '+1 555-019-2831',
      rsvpStatus: 'attending',
      dietaryPreference: 'vegan',
      dietaryNotes: 'Strict vegan, no dairy or honey',
      plusOne: true,
      tableAssignment: 'Table 4',
      invitationSent: true,
      updatedAt: '2026-10-15T12:00:00.000Z',
    };

    const parsed = GuestRecordSchema.safeParse(validGuest);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid email formats in GuestRecord', () => {
    const invalidGuest = {
      id: 'g-bad',
      fullName: 'No Email Person',
      email: 'not-a-valid-email',
      rsvpStatus: 'pending',
      dietaryPreference: 'none',
      plusOne: false,
      invitationSent: false,
      updatedAt: new Date().toISOString(),
    };

    const parsed = GuestRecordSchema.safeParse(invalidGuest);
    expect(parsed.success).toBe(false);
  });

  it('calculates comprehensive guest statistics and headcount', () => {
    const stats = calculateGuestStats(defaultShowcaseGuests);

    expect(stats.totalInvited).toBe(defaultShowcaseGuests.length);
    expect(stats.attending).toBeGreaterThan(0);
    expect(stats.totalExpectedHeadcount).toBe(stats.attending + stats.plusOnesCount);
    expect(stats.responseRatePercentage).toBeGreaterThanOrEqual(0);
    expect(stats.responseRatePercentage).toBeLessThanOrEqual(100);
    expect(stats.dietaryBreakdown).toBeDefined();
  });

  it('accurately isolates plus-one headcount to only attending guests', () => {
    const customGuests: GuestRecord[] = [
      {
        id: 'g-1',
        fullName: 'Attending With Plus One',
        email: 'attending1@test.com',
        rsvpStatus: 'attending',
        dietaryPreference: 'none',
        plusOne: true,
        invitationSent: true,
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
      {
        id: 'g-2',
        fullName: 'Attending Solo',
        email: 'attending2@test.com',
        rsvpStatus: 'attending',
        dietaryPreference: 'gluten_free',
        plusOne: false,
        invitationSent: true,
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
      {
        id: 'g-3',
        fullName: 'Declined With Plus One',
        email: 'declined@test.com',
        rsvpStatus: 'declined',
        dietaryPreference: 'vegan',
        plusOne: true, // Should NOT be counted in confirmed heads
        invitationSent: true,
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
      {
        id: 'g-4',
        fullName: 'Pending Guest',
        email: 'pending@test.com',
        rsvpStatus: 'pending',
        dietaryPreference: 'nut_allergy',
        plusOne: true, // Should NOT be counted in confirmed heads
        invitationSent: false,
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
    ];

    const stats = calculateGuestStats(customGuests);

    expect(stats.totalInvited).toBe(4);
    expect(stats.attending).toBe(2);
    expect(stats.declined).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.plusOnesCount).toBe(1);
    // Confirmed heads: 2 attending primaries + 1 attending plus-one = 3
    expect(stats.totalExpectedHeadcount).toBe(3);
    // Response rate: 3 responded out of 4 = 75%
    expect(stats.responseRatePercentage).toBe(75);

    // Dietary breakdown: attending g-1 (none) with plusOne counts for 2, g-2 (gluten_free) counts for 1
    expect(stats.dietaryBreakdown.none).toBe(2);
    expect(stats.dietaryBreakdown.gluten_free).toBe(1);
    // Declined and pending are not in the attending dietary breakdown
    expect(stats.dietaryBreakdown.vegan).toBe(0);
    expect(stats.dietaryBreakdown.nut_allergy).toBe(0);
  });

  it('handles empty guest list without division by zero or errors', () => {
    const stats = calculateGuestStats([]);

    expect(stats.totalInvited).toBe(0);
    expect(stats.attending).toBe(0);
    expect(stats.declined).toBe(0);
    expect(stats.pending).toBe(0);
    expect(stats.plusOnesCount).toBe(0);
    expect(stats.totalExpectedHeadcount).toBe(0);
    expect(stats.responseRatePercentage).toBe(0);
    expect(stats.dietaryBreakdown.none).toBe(0);
  });

  it('has human-readable labels for all supported dietary restrictions', () => {
    expect(DIETARY_LABELS.none).toBe('Standard / No Restrictions');
    expect(DIETARY_LABELS.vegan).toBe('Vegan');
    expect(DIETARY_LABELS.vegetarian).toBe('Vegetarian');
    expect(DIETARY_LABELS.gluten_free).toBe('Gluten-Free');
    expect(DIETARY_LABELS.nut_allergy).toBe('Nut Allergy (Severe)');
    expect(DIETARY_LABELS.halal).toBe('Halal Certified');
    expect(DIETARY_LABELS.kosher).toBe('Kosher Certified');
    expect(DIETARY_LABELS.dairy_free).toBe('Dairy-Free / Lactose Intolerant');
    expect(DIETARY_LABELS.other).toBe('Special Request');
  });

  it('detects duplicate emails case-insensitively across existing guest records', () => {
    const existingGuests: GuestRecord[] = [
      {
        id: 'g-1',
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
        rsvpStatus: 'attending',
        dietaryPreference: 'none',
        plusOne: false,
        invitationSent: true,
        updatedAt: '2026-10-15T00:00:00.000Z',
      },
    ];

    const isDuplicate = (email: string, excludeId?: string) => {
      const trimmed = email.trim().toLowerCase();
      return existingGuests.some(
        (g) => (!excludeId || g.id !== excludeId) && g.email?.trim().toLowerCase() === trimmed
      );
    };

    expect(isDuplicate('JANE.DOE@EXAMPLE.COM')).toBe(true);
    expect(isDuplicate('jane.doe@example.com', 'g-1')).toBe(false); // same guest updating
    expect(isDuplicate('john.smith@example.com')).toBe(false);
  });
});

