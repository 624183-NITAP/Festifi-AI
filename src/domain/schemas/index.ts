/**
 * FestiFi AI — Zod Validation Schemas
 * Comprehensive runtime validation for external inputs, API payloads,
 * and AI-generated outputs. Ensures type-safety, rejects malformed data,
 * and eliminates injection vectors.
 */

import { z } from 'zod';

export const EventTypeSchema = z.enum([
  'wedding',
  'birthday',
  'community',
  'anniversary',
  'corporate',
  'baby_shower',
  'other',
]);

export const CurrencyCodeSchema = z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']);

export const PriorityLevelSchema = z.enum(['must_have', 'nice_to_have', 'optional']);

export const ExpenseStatusSchema = z.enum(['planned', 'quoted', 'confirmed', 'paid']);

export const BudgetCategorySchema = z.enum([
  'venue',
  'catering',
  'entertainment',
  'photography',
  'decor',
  'attire',
  'invitations',
  'logistics',
  'miscellaneous',
]);

export const VendorStatusSchema = z.enum(['contacted', 'quoted', 'hired', 'declined']);

export const ScenarioTypeSchema = z.enum([
  'guest_count_change',
  'budget_reduction',
  'rain_contingency',
  'vendor_cancellation',
  'date_change',
  'dietary_requirements',
]);

// Helper for validating ISO YYYY-MM-DD
const isoDateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const IsoDateSchema = z.string().regex(isoDateRegex, {
  message: 'Date must be formatted as YYYY-MM-DD',
}).refine((val) => {
  const [year, month, day] = val.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}, { message: 'Date is not a mathematically valid calendar day (e.g. invalid leap day or month)' });

// Event Details Schema
export const EventDetailsSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(100, 'Title cannot exceed 100 characters'),
  type: EventTypeSchema,
  theme: z.string().trim().max(100).default('Elegant Celebration'),
  targetDate: IsoDateSchema,
  guestCount: z.number().int('Guests must be a whole number').min(1, 'Guest count must be at least 1').max(100000, 'Guest count exceeds maximum limit'),
  currency: CurrencyCodeSchema.default('USD'),
  totalBudgetMinor: z.number().int('Budget must be an integer in minor units').nonnegative('Budget cannot be negative').max(100000000000, 'Budget exceeds supported limit'),
  contingencyPercentage: z.number().min(0, 'Contingency cannot be negative').max(50, 'Contingency cannot exceed 50%').default(10),
  location: z.string().trim().max(120).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
  createdAt: z.string().datetime().optional().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().optional().default(() => new Date().toISOString()),
});

// Create Event Input Schema (from User UI)
export const CreateEventInputSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(100),
  type: EventTypeSchema,
  theme: z.string().trim().max(100).optional().default('Celebration'),
  targetDate: IsoDateSchema,
  guestCount: z.number().int().min(1, 'Must have at least 1 guest').max(100000),
  currency: CurrencyCodeSchema.default('USD'),
  totalBudgetDecimal: z.number().nonnegative('Budget cannot be negative').max(1000000000),
  contingencyPercentage: z.number().min(0).max(50).default(10),
  location: z.string().trim().max(120).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
});

// Expense Item Schema
export const ExpenseItemSchema = z.object({
  id: z.string().min(1).max(64),
  categoryId: BudgetCategorySchema,
  name: z.string().trim().min(1, 'Name required').max(120),
  estimatedCostMinor: z.number().int().nonnegative('Estimated cost cannot be negative'),
  actualCostMinor: z.number().int().nonnegative().nullable().default(null),
  paidMinor: z.number().int().nonnegative('Paid amount cannot be negative').default(0),
  status: ExpenseStatusSchema.default('planned'),
  priority: PriorityLevelSchema.default('must_have'),
  isContingency: z.boolean().optional().default(false),
  vendorName: z.string().trim().max(100).nullable().optional().default(null),
  notes: z.string().trim().max(500).optional().default(''),
});

// Timeline Task Schema
export const TimelineTaskSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(500).default(''),
  category: z.union([BudgetCategorySchema, z.literal('general'), z.literal('permits'), z.literal('rsvp')]),
  deadline: IsoDateSchema,
  daysBeforeEvent: z.number().int(),
  completed: z.boolean().default(false),
  completedAt: z.string().datetime().nullable().optional().default(null),
  priority: PriorityLevelSchema.default('must_have'),
  dependencies: z.array(z.string()).default([]),
  milestone: z.string().max(80).default('Key Milestone'),
});

// Vendor Record Schema
export const VendorRecordSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(2).max(100),
  category: BudgetCategorySchema,
  contactPerson: z.string().trim().max(100).default(''),
  email: z.string().trim().email('Invalid email').or(z.literal('')).default(''),
  phone: z.string().trim().max(30).default(''),
  quotedPriceMinor: z.number().int().nonnegative().nullable().default(null),
  status: VendorStatusSchema.default('contacted'),
  notes: z.string().trim().max(1000).default(''),
  inquiryMessage: z.string().max(2000).nullable().optional().default(null),
});

// AI Plan Generation Response Schema
export const CreativeConceptSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(600),
  estimatedVibe: z.string().max(80),
  suitability: z.string().max(120),
});

export const ThemeAlternativeSchema = z.object({
  name: z.string().min(1).max(80),
  colorPalette: z.array(z.string()).min(2).max(6),
  decorIdeas: z.array(z.string()).min(1).max(8),
  vibe: z.string().max(80),
});

export const MenuSuggestionSchema = z.object({
  course: z.string().min(1).max(60),
  item: z.string().min(1).max(100),
  dietaryNotes: z.string().max(100),
  description: z.string().max(300),
});

export const EntertainmentOptionSchema = z.object({
  type: z.string().min(1).max(80),
  description: z.string().max(300),
  estimatedCostTier: z.enum(['budget', 'moderate', 'luxury']),
});

export const RecommendedTaskSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(300),
  category: z.union([BudgetCategorySchema, z.literal('general'), z.literal('permits'), z.literal('rsvp')]),
  daysBeforeEvent: z.number().int().min(0).max(730),
  priority: PriorityLevelSchema,
  milestone: z.string().max(60),
});

export const RecommendedExpenseSchema = z.object({
  categoryId: BudgetCategorySchema,
  name: z.string().min(2).max(100),
  estimatedCostMinor: z.number().int().nonnegative(),
  priority: PriorityLevelSchema,
});

export const GeneratedEventPlanSchema = z.object({
  concepts: z.array(CreativeConceptSchema).min(1).max(6),
  themes: z.array(ThemeAlternativeSchema).min(1).max(6),
  menu: z.array(MenuSuggestionSchema).min(1).max(12),
  entertainment: z.array(EntertainmentOptionSchema).min(1).max(6),
  recommendedTasks: z.array(RecommendedTaskSchema).min(1).max(30),
  recommendedExpenses: z.array(RecommendedExpenseSchema).min(1).max(30),
  aiAssumptions: z.array(z.string().max(300)).default([]),
});

// Budget Optimization Request Schema
export const OptimizeBudgetRequestSchema = z.object({
  event: EventDetailsSchema,
  expenses: z.array(ExpenseItemSchema),
});

// Scenario Simulation Request Schema
export const SimulateScenarioRequestSchema = z.object({
  scenarioType: ScenarioTypeSchema,
  event: EventDetailsSchema,
  expenses: z.array(ExpenseItemSchema),
  scenarioParams: z.record(z.unknown()).optional().default({}),
});

// Vendor Inquiry Request Schema
export const VendorInquiryRequestSchema = z.object({
  event: EventDetailsSchema,
  vendor: VendorRecordSchema,
  specialRequests: z.string().max(500).optional().default(''),
});
