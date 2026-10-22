import { describe, expect, it } from 'vitest';
import { generateDeterministicVendorInquiry, VENDOR_CHECKLIST_TIPS } from '@/domain/vendors';
import { EventDetails, VendorRecord } from '@/domain/types';

describe('Vendor Domain Services (generateDeterministicVendorInquiry)', () => {
  const mockEvent: EventDetails = {
    id: 'ev-test',
    title: 'Emerald Forest Wedding',
    type: 'wedding',
    theme: 'Rustic Woodland',
    targetDate: '2027-06-15',
    guestCount: 95,
    currency: 'USD',
    totalBudgetMinor: 3000000,
    contingencyPercentage: 10,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const mockVendorWithContact: VendorRecord = {
    id: 'v-1',
    name: 'Artisan Floral Design Co.',
    category: 'decor',
    contactPerson: 'Elena Vance',
    email: 'elena@artisanflorals.com',
    phone: '555-0144',
    quotedPriceMinor: 250000,
    status: 'contacted',
    notes: 'Preferred florist for botanical table designs.',
  };

  const mockVendorWithoutContact: VendorRecord = {
    id: 'v-2',
    name: 'Soundwave DJ Collective',
    category: 'entertainment',
    contactPerson: '',
    email: 'booking@soundwave.io',
    phone: '555-0188',
    quotedPriceMinor: 150000,
    status: 'quoted',
    notes: 'Recommended by venue management.',
  };

  it('generates personalized inquiry addressing contact person when present', () => {
    const result = generateDeterministicVendorInquiry(mockEvent, mockVendorWithContact);

    expect(result.inquiryMessage).toContain('Dear Elena Vance,');
    expect(result.inquiryMessage).toContain('Emerald Forest Wedding');
    expect(result.inquiryMessage).toContain('2027-06-15');
    expect(result.inquiryMessage).toContain('estimated guest count of 95');
    expect(result.inquiryMessage).toContain('Decor, Florals & Lighting');
    expect(result.checklistTips).toEqual(VENDOR_CHECKLIST_TIPS);
    expect(result.isAiGenerated).toBe(false);
    expect(result.providerName).toBe('FestiFi Deterministic Template Engine');
  });

  it('falls back to team salutation when contact person is empty or whitespace', () => {
    const result = generateDeterministicVendorInquiry(mockEvent, mockVendorWithoutContact);

    expect(result.inquiryMessage).toContain('Dear Soundwave DJ Collective Team,');
    expect(result.inquiryMessage).toContain('Entertainment & Music');
  });

  it('embeds custom requirements notes when provided', () => {
    const customNotes = 'Need wireless microphones and battery-powered speakers for outdoor meadow ceremony.';
    const result = generateDeterministicVendorInquiry(mockEvent, mockVendorWithoutContact, customNotes);

    expect(result.inquiryMessage).toContain('Specific requirements to keep in mind:');
    expect(result.inquiryMessage).toContain(customNotes);
  });
});
