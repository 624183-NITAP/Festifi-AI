/**
 * FestiFi AI — Domain Type Guards
 * Runtime type guards ensuring safe, uncoerced parsing of user input and enum values.
 */

import {
  BudgetCategory,
  CurrencyCode,
  DietaryRestriction,
  EventType,
  PriorityLevel,
  RsvpStatus,
  VendorStatus,
} from './index';

export const VALID_EVENT_TYPES: readonly EventType[] = [
  'wedding',
  'birthday',
  'community',
  'anniversary',
  'corporate',
  'baby_shower',
  'other',
] as const;

export const VALID_CURRENCIES: readonly CurrencyCode[] = [
  'USD',
  'EUR',
  'GBP',
  'INR',
  'CAD',
  'AUD',
] as const;

export const VALID_PRIORITIES: readonly PriorityLevel[] = [
  'must_have',
  'nice_to_have',
  'optional',
] as const;

export const VALID_CATEGORIES: readonly BudgetCategory[] = [
  'venue',
  'catering',
  'entertainment',
  'photography',
  'decor',
  'attire',
  'invitations',
  'logistics',
  'miscellaneous',
] as const;

export const VALID_RSVP_STATUSES: readonly RsvpStatus[] = [
  'attending',
  'declined',
  'pending',
] as const;

export const VALID_VENDOR_STATUSES: readonly VendorStatus[] = [
  'contacted',
  'quoted',
  'hired',
  'declined',
] as const;

export const VALID_DIETARY_OPTIONS: readonly DietaryRestriction[] = [
  'none',
  'vegetarian',
  'vegan',
  'gluten_free',
  'nut_allergy',
  'halal',
  'kosher',
  'dairy_free',
  'other',
] as const;

export function isEventType(val: unknown): val is EventType {
  return typeof val === 'string' && (VALID_EVENT_TYPES as readonly string[]).includes(val);
}

export function isCurrencyCode(val: unknown): val is CurrencyCode {
  return typeof val === 'string' && (VALID_CURRENCIES as readonly string[]).includes(val);
}

export function isPriorityLevel(val: unknown): val is PriorityLevel {
  return typeof val === 'string' && (VALID_PRIORITIES as readonly string[]).includes(val);
}

export function isBudgetCategory(val: unknown): val is BudgetCategory {
  return typeof val === 'string' && (VALID_CATEGORIES as readonly string[]).includes(val);
}

export function isRsvpStatus(val: unknown): val is RsvpStatus {
  return typeof val === 'string' && (VALID_RSVP_STATUSES as readonly string[]).includes(val);
}

export function isVendorStatus(val: unknown): val is VendorStatus {
  return typeof val === 'string' && (VALID_VENDOR_STATUSES as readonly string[]).includes(val);
}

export function isDietaryRestriction(val: unknown): val is DietaryRestriction {
  return typeof val === 'string' && (VALID_DIETARY_OPTIONS as readonly string[]).includes(val);
}
