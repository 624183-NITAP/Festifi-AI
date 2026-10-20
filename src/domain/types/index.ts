/**
 * FestiFi AI — Core Domain Types
 * Strict, pure, immutable representations of Celebration & Event domain entities.
 * All monetary amounts are integer minor currency units (e.g., cents, paise, pence)
 * to guarantee complete immunity against IEEE 754 floating-point inaccuracies.
 */

export type EventType =
  | 'wedding'
  | 'birthday'
  | 'community'
  | 'anniversary'
  | 'corporate'
  | 'baby_shower'
  | 'other';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD';

export type PriorityLevel = 'must_have' | 'nice_to_have' | 'optional';

export type ExpenseStatus = 'planned' | 'quoted' | 'confirmed' | 'paid';

export type BudgetCategory =
  | 'venue'
  | 'catering'
  | 'entertainment'
  | 'photography'
  | 'decor'
  | 'attire'
  | 'invitations'
  | 'logistics'
  | 'miscellaneous';

export interface ExpenseItem {
  id: string;
  categoryId: BudgetCategory;
  name: string;
  estimatedCostMinor: number;
  actualCostMinor: number | null;
  paidMinor: number;
  status: ExpenseStatus;
  priority: PriorityLevel;
  isContingency?: boolean;
  vendorName?: string | null;
  notes?: string;
}

export interface CategoryBreakdown {
  categoryId: BudgetCategory;
  categoryName: string;
  allocatedMinor: number;
  confirmedMinor: number;
  paidMinor: number;
  percentageOfBudget: number;
  itemCount: number;
}

export interface BudgetSummary {
  totalBudgetMinor: number;
  contingencyReserveMinor: number;
  plannedMinor: number;
  confirmedMinor: number;
  paidMinor: number;
  unallocatedMinor: number;
  remainingMinor: number;
  varianceMinor: number;
  perPersonEstimateMinor: number;
  isOverBudget: boolean;
  categoryBreakdown: CategoryBreakdown[];
}

export interface EventDetails {
  id: string;
  title: string;
  type: EventType;
  theme: string;
  targetDate: string; // ISO YYYY-MM-DD
  guestCount: number;
  currency: CurrencyCode;
  totalBudgetMinor: number;
  contingencyPercentage: number;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  category: BudgetCategory | 'general' | 'permits' | 'rsvp';
  deadline: string; // ISO YYYY-MM-DD
  daysBeforeEvent: number;
  completed: boolean;
  completedAt?: string | null;
  priority: PriorityLevel;
  dependencies: string[]; // task IDs
  milestone: string;
}

export interface TimelineProgress {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionPercentage: number;
}

export type VendorStatus = 'contacted' | 'quoted' | 'hired' | 'declined';

export interface VendorRecord {
  id: string;
  name: string;
  category: BudgetCategory;
  contactPerson: string;
  email: string;
  phone: string;
  quotedPriceMinor: number | null;
  status: VendorStatus;
  notes: string;
  inquiryMessage?: string | null;
}

export type ScenarioType =
  | 'guest_count_change'
  | 'budget_reduction'
  | 'rain_contingency'
  | 'vendor_cancellation'
  | 'date_change'
  | 'dietary_requirements';

export interface ScenarioTradeoff {
  item: string;
  change: string;
  reason: string;
  savingsMinor: number;
}

export interface ScenarioImpact {
  scenarioType: ScenarioType;
  title: string;
  description: string;
  costDeltaMinor: number;
  affectedCategories: BudgetCategory[];
  riskLevel: 'low' | 'medium' | 'high';
  contingencyImpactMinor: number;
  summaryBefore: BudgetSummary;
  summaryAfter: BudgetSummary;
  proposedAdjustments: Array<{ description: string; costDeltaMinor: number }>;
  adjustedExpenses: ExpenseItem[];
  recommendations: string[];
}

export interface BudgetOptimizationProposal {
  proposalId: string;
  rationale: string;
  summaryBefore: BudgetSummary;
  summaryAfter: BudgetSummary;
  tradeoffs: ScenarioTradeoff[];
  proposedExpenses: ExpenseItem[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface CreativeConcept {
  title: string;
  description: string;
  estimatedVibe: string;
  suitability: string;
}

export interface ThemeAlternative {
  name: string;
  colorPalette: string[];
  decorIdeas: string[];
  vibe: string;
}

export interface MenuSuggestion {
  course: string;
  item: string;
  dietaryNotes: string;
  description: string;
}

export interface EntertainmentOption {
  type: string;
  description: string;
  estimatedCostTier: 'budget' | 'moderate' | 'luxury';
}

export interface GeneratedEventPlan {
  concepts: CreativeConcept[];
  themes: ThemeAlternative[];
  menu: MenuSuggestion[];
  entertainment: EntertainmentOption[];
  recommendedTasks: Array<{
    title: string;
    description: string;
    category: BudgetCategory | 'general' | 'permits' | 'rsvp';
    daysBeforeEvent: number;
    priority: PriorityLevel;
    milestone: string;
  }>;
  recommendedExpenses: Array<{
    categoryId: BudgetCategory;
    name: string;
    estimatedCostMinor: number;
    priority: PriorityLevel;
  }>;
  aiAssumptions: string[];
}

export interface EventPlanState {
  event: EventDetails;
  expenses: ExpenseItem[];
  tasks: TimelineTask[];
  vendors: VendorRecord[];
  activeProposal: BudgetOptimizationProposal | null;
  activeScenarioImpact: ScenarioImpact | null;
  generatedIdeas: GeneratedEventPlan | null;
}
