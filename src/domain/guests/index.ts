/**
 * FestiFi AI — Guest List & RSVP Domain Engine
 * Pure calculations for attendee headcounts, RSVP conversion rates,
 * plus-ones, and dietary restrictions aggregation.
 */

import { DietaryRestriction, GuestRecord, RsvpStatus } from '../types';

export interface GuestStats {
  totalInvited: number;
  attending: number;
  declined: number;
  pending: number;
  plusOnesCount: number;
  totalExpectedHeadcount: number;
  responseRatePercentage: number;
  dietaryBreakdown: Record<DietaryRestriction, number>;
}

export const DIETARY_LABELS: Record<DietaryRestriction, string> = {
  none: 'Standard / No Restrictions',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  gluten_free: 'Gluten-Free',
  nut_allergy: 'Nut Allergy (Severe)',
  halal: 'Halal Certified',
  kosher: 'Kosher Certified',
  dairy_free: 'Dairy-Free / Lactose Intolerant',
  other: 'Special Request',
};

export const ALL_DIETARY_OPTIONS: DietaryRestriction[] = [
  'none',
  'vegetarian',
  'vegan',
  'gluten_free',
  'nut_allergy',
  'halal',
  'kosher',
  'dairy_free',
  'other',
];

/**
 * Calculates comprehensive statistical aggregation across the guest list.
 */
export function calculateGuestStats(guests: GuestRecord[]): GuestStats {
  const totalInvited = guests.length;

  const dietaryBreakdown: Record<DietaryRestriction, number> = {
    none: 0,
    vegetarian: 0,
    vegan: 0,
    gluten_free: 0,
    nut_allergy: 0,
    halal: 0,
    kosher: 0,
    dairy_free: 0,
    other: 0,
  };

  if (totalInvited === 0) {
    return {
      totalInvited: 0,
      attending: 0,
      declined: 0,
      pending: 0,
      plusOnesCount: 0,
      totalExpectedHeadcount: 0,
      responseRatePercentage: 0,
      dietaryBreakdown,
    };
  }

  let attending = 0;
  let declined = 0;
  let pending = 0;
  let plusOnesCount = 0;

  for (const guest of guests) {
    if (guest.rsvpStatus === 'attending') {
      attending += 1;
      if (guest.plusOne) {
        plusOnesCount += 1;
      }
      dietaryBreakdown[guest.dietaryPreference] =
        (dietaryBreakdown[guest.dietaryPreference] || 0) + (guest.plusOne ? 2 : 1);
    } else if (guest.rsvpStatus === 'declined') {
      declined += 1;
    } else {
      pending += 1;
    }
  }

  const totalExpectedHeadcount = attending + plusOnesCount;
  const responded = attending + declined;
  const responseRatePercentage = Math.round((responded / totalInvited) * 100);

  return {
    totalInvited,
    attending,
    declined,
    pending,
    plusOnesCount,
    totalExpectedHeadcount,
    responseRatePercentage,
    dietaryBreakdown,
  };
}

/**
 * Initial showcase guest roster for the Emerald Botanical Wedding.
 */
export const defaultShowcaseGuests: GuestRecord[] = [
  {
    id: 'g-1',
    fullName: 'Eleanor Vance',
    email: 'eleanor.vance@example.com',
    phone: '+1 555-019-2831',
    rsvpStatus: 'attending',
    dietaryPreference: 'vegetarian',
    dietaryNotes: 'Prefers mushroom entree',
    plusOne: true,
    tableAssignment: 'Table 1 (Honor)',
    invitationSent: true,
    updatedAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'g-2',
    fullName: 'Dr. Julian Thorne',
    email: 'jthorne@example.org',
    phone: '+1 555-019-4422',
    rsvpStatus: 'attending',
    dietaryPreference: 'gluten_free',
    dietaryNotes: 'Celiac safe preparation required',
    plusOne: false,
    tableAssignment: 'Table 1 (Honor)',
    invitationSent: true,
    updatedAt: '2026-10-11T14:30:00.000Z',
  },
  {
    id: 'g-3',
    fullName: 'Maya Lin-Peterson',
    email: 'maya.lin@example.com',
    phone: '+1 555-019-8811',
    rsvpStatus: 'attending',
    dietaryPreference: 'vegan',
    dietaryNotes: 'Strict vegan, no honey',
    plusOne: true,
    tableAssignment: 'Table 2 (Botanical)',
    invitationSent: true,
    updatedAt: '2026-10-12T09:15:00.000Z',
  },
  {
    id: 'g-4',
    fullName: 'David Sterling',
    email: 'david.sterling@example.com',
    phone: '+1 555-019-9944',
    rsvpStatus: 'attending',
    dietaryPreference: 'none',
    dietaryNotes: '',
    plusOne: true,
    tableAssignment: 'Table 2 (Botanical)',
    invitationSent: true,
    updatedAt: '2026-10-12T16:00:00.000Z',
  },
  {
    id: 'g-5',
    fullName: 'Amina Al-Mansoor',
    email: 'amina.m@example.net',
    phone: '+1 555-019-3388',
    rsvpStatus: 'attending',
    dietaryPreference: 'halal',
    dietaryNotes: 'Halal meat option verified with chef',
    plusOne: false,
    tableAssignment: 'Table 3 (Orchid)',
    invitationSent: true,
    updatedAt: '2026-10-13T11:20:00.000Z',
  },
  {
    id: 'g-6',
    fullName: 'Thomas Gallagher',
    email: 'tgallagher@example.com',
    phone: '+1 555-019-1122',
    rsvpStatus: 'attending',
    dietaryPreference: 'nut_allergy',
    dietaryNotes: 'Severe airborne and contact peanut allergy',
    plusOne: false,
    tableAssignment: 'Table 3 (Orchid)',
    invitationSent: true,
    updatedAt: '2026-10-14T10:00:00.000Z',
  },
  {
    id: 'g-7',
    fullName: 'Sarah & Mark Chen',
    email: 'chen.family@example.com',
    phone: '+1 555-019-7733',
    rsvpStatus: 'pending',
    dietaryPreference: 'none',
    dietaryNotes: '',
    plusOne: true,
    tableAssignment: 'Table 4 (Fern)',
    invitationSent: true,
    updatedAt: '2026-10-05T08:00:00.000Z',
  },
  {
    id: 'g-8',
    fullName: 'Robert DeMarco',
    email: 'rdemarco@example.org',
    phone: '+1 555-019-6655',
    rsvpStatus: 'pending',
    dietaryPreference: 'dairy_free',
    dietaryNotes: 'Lactose intolerance',
    plusOne: false,
    tableAssignment: '',
    invitationSent: true,
    updatedAt: '2026-10-05T08:00:00.000Z',
  },
  {
    id: 'g-9',
    fullName: 'Claire Beaumont',
    email: 'cbeaumont@example.com',
    phone: '+1 555-019-2244',
    rsvpStatus: 'declined',
    dietaryPreference: 'none',
    dietaryNotes: 'Traveling overseas for work commitment',
    plusOne: false,
    tableAssignment: '',
    invitationSent: true,
    updatedAt: '2026-10-08T18:45:00.000Z',
  },
  {
    id: 'g-10',
    fullName: 'Kenneth Wright',
    email: 'kwright@example.net',
    phone: '+1 555-019-5566',
    rsvpStatus: 'pending',
    dietaryPreference: 'none',
    dietaryNotes: '',
    plusOne: false,
    tableAssignment: '',
    invitationSent: true,
    updatedAt: '2026-10-05T08:00:00.000Z',
  },
];
