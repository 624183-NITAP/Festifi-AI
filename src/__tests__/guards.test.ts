import { describe, expect, it } from 'vitest';
import {
  isEventType,
  isCurrencyCode,
  isPriorityLevel,
  isBudgetCategory,
  isRsvpStatus,
  isVendorStatus,
  isDietaryRestriction,
  VALID_EVENT_TYPES,
  VALID_CURRENCIES,
  VALID_PRIORITIES,
  VALID_CATEGORIES,
  VALID_RSVP_STATUSES,
  VALID_VENDOR_STATUSES,
  VALID_DIETARY_OPTIONS,
} from '@/domain/types/guards';

describe('Domain Runtime Type Guards (src/domain/types/guards.ts)', () => {
  describe('isEventType', () => {
    it('accepts all valid EventType enum values', () => {
      for (const type of VALID_EVENT_TYPES) {
        expect(isEventType(type)).toBe(true);
      }
    });

    it('rejects invalid strings, empty string, and non-strings', () => {
      expect(isEventType('')).toBe(false);
      expect(isEventType('gala')).toBe(false);
      expect(isEventType('WEDDING')).toBe(false);
      expect(isEventType(null)).toBe(false);
      expect(isEventType(undefined)).toBe(false);
      expect(isEventType(123)).toBe(false);
      expect(isEventType({})).toBe(false);
      expect(isEventType(['wedding'])).toBe(false);
    });
  });

  describe('isCurrencyCode', () => {
    it('accepts all valid CurrencyCode enum values', () => {
      for (const curr of VALID_CURRENCIES) {
        expect(isCurrencyCode(curr)).toBe(true);
      }
    });

    it('rejects unsupported currencies and non-strings', () => {
      expect(isCurrencyCode('JPY')).toBe(false);
      expect(isCurrencyCode('usd')).toBe(false);
      expect(isCurrencyCode('')).toBe(false);
      expect(isCurrencyCode(null)).toBe(false);
      expect(isCurrencyCode(undefined)).toBe(false);
      expect(isCurrencyCode({ currency: 'USD' })).toBe(false);
    });
  });

  describe('isPriorityLevel', () => {
    it('accepts must_have, nice_to_have, optional', () => {
      for (const priority of VALID_PRIORITIES) {
        expect(isPriorityLevel(priority)).toBe(true);
      }
    });

    it('rejects arbitrary priorities and non-strings', () => {
      expect(isPriorityLevel('critical')).toBe(false);
      expect(isPriorityLevel('low')).toBe(false);
      expect(isPriorityLevel('')).toBe(false);
      expect(isPriorityLevel(null)).toBe(false);
      expect(isPriorityLevel(1)).toBe(false);
    });
  });

  describe('isBudgetCategory', () => {
    it('accepts all standard budget categories', () => {
      for (const cat of VALID_CATEGORIES) {
        expect(isBudgetCategory(cat)).toBe(true);
      }
    });

    it('rejects unknown categories and invalid inputs', () => {
      expect(isBudgetCategory('travel')).toBe(false);
      expect(isBudgetCategory('Catering')).toBe(false);
      expect(isBudgetCategory('')).toBe(false);
      expect(isBudgetCategory(null)).toBe(false);
      expect(isBudgetCategory(undefined)).toBe(false);
    });
  });

  describe('isRsvpStatus', () => {
    it('accepts attending, declined, pending', () => {
      for (const status of VALID_RSVP_STATUSES) {
        expect(isRsvpStatus(status)).toBe(true);
      }
    });

    it('rejects unknown RSVP statuses and non-strings', () => {
      expect(isRsvpStatus('maybe')).toBe(false);
      expect(isRsvpStatus('accepted')).toBe(false);
      expect(isRsvpStatus('')).toBe(false);
      expect(isRsvpStatus(null)).toBe(false);
      expect(isRsvpStatus(undefined)).toBe(false);
    });
  });

  describe('isVendorStatus', () => {
    it('accepts contacted, quoted, hired, declined', () => {
      for (const status of VALID_VENDOR_STATUSES) {
        expect(isVendorStatus(status)).toBe(true);
      }
    });

    it('rejects non-vendor statuses and non-strings', () => {
      expect(isVendorStatus('pending')).toBe(false);
      expect(isVendorStatus('contracted')).toBe(false);
      expect(isVendorStatus('')).toBe(false);
      expect(isVendorStatus(null)).toBe(false);
    });
  });

  describe('isDietaryRestriction', () => {
    it('accepts all defined dietary options', () => {
      for (const option of VALID_DIETARY_OPTIONS) {
        expect(isDietaryRestriction(option)).toBe(true);
      }
    });

    it('rejects unknown dietary restrictions and non-strings', () => {
      expect(isDietaryRestriction('keto')).toBe(false);
      expect(isDietaryRestriction('carnivore')).toBe(false);
      expect(isDietaryRestriction('')).toBe(false);
      expect(isDietaryRestriction(null)).toBe(false);
      expect(isDietaryRestriction(undefined)).toBe(false);
    });
  });
});
