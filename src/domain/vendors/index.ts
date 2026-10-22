/**
 * FestiFi AI — Vendor Domain Services
 * Pure business logic for vendor inquiries, quotation requests,
 * contract safeguards, and vetting checklists.
 */

import { CATEGORY_NAMES } from '../budget';
import { EventDetails, VendorRecord } from '../types';

export interface VendorInquiryResult {
  inquiryMessage: string;
  checklistTips: string[];
  isAiGenerated: boolean;
  providerName: string;
}

export const VENDOR_CHECKLIST_TIPS: string[] = [
  'Request proof of commercial general liability insurance for venue compliance.',
  'Confirm overtime hourly rates in writing before signing the contract.',
  'Ensure cancellation policy explicitly addresses weather disruptions and forced rescheduling.',
  'Clarify dietary allergen handling protocol and kitchen cross-contact guarantees.',
];

/**
 * Deterministically formats a formal, professional vendor inquiry message and diligence checklist.
 * Pure function safe for client-side rendering or offline fallback.
 */
export function generateDeterministicVendorInquiry(
  event: EventDetails,
  vendor: VendorRecord,
  notes?: string
): VendorInquiryResult {
  const categoryLabel = CATEGORY_NAMES[vendor.category] || vendor.category;
  const salutation = vendor.contactPerson?.trim()
    ? `Dear ${vendor.contactPerson.trim()},`
    : `Dear ${vendor.name} Team,`;

  const eventTypeLabel = event.type.replace(/_/g, ' ');

  const paragraphs = [
    salutation,
    '',
    `I am organizing an upcoming ${eventTypeLabel} titled "${event.title}" planned for ${event.targetDate} with an estimated guest count of ${event.guestCount}.`,
    '',
    `We are currently shortlisting trusted partners for our ${categoryLabel} needs. We would love to request a formal quotation and inquire about your availability for this date.`,
    notes?.trim() ? `Specific requirements to keep in mind:\n- ${notes.trim()}\n` : '',
    'Could you kindly share:',
    '1. Your standard package inclusions and itemized pricing.',
    '2. Minimum deposit terms, cancellation policies, and postponement flexibility.',
    '3. Load-in, setup, and teardown logistics schedule.',
    '',
    'Thank you so much for your time and guidance. We look forward to your response!',
    '',
    'Warm regards,',
    `Event Planning Team — ${event.title}`,
  ].filter(Boolean);

  return {
    inquiryMessage: paragraphs.join('\n'),
    checklistTips: [...VENDOR_CHECKLIST_TIPS],
    isAiGenerated: false,
    providerName: 'FestiFi Deterministic Template Engine',
  };
}
