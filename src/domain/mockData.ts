/**
 * FestiFi AI — Showcase Seed Data & State Initialization
 * Canonical demonstration fixtures for initial app load, showcase tours, and tests.
 */

import { defaultShowcaseGuests } from './guests';
import { deriveTasksFromEvent } from './timeline';
import {
  EventDetails,
  EventPlanState,
  ExpenseItem,
  GeneratedEventPlan,
  VendorRecord,
} from './types';

export const defaultShowcaseEvent: EventDetails = {
  id: 'ev-emerald-wedding-2027',
  title: 'Emerald Forest Botanical Wedding',
  type: 'wedding',
  theme: 'Botanical Luxury & Champagne Luminary',
  targetDate: '2027-06-18',
  guestCount: 120,
  currency: 'USD',
  totalBudgetMinor: 3500000, // $35,000.00
  contingencyPercentage: 10,  // $3,500.00
  location: 'Highland Botanical Greenhouse',
  notes: 'Cocktail reception on lawn, sit-down dinner in conservatory. Need vegan options.',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

export const defaultShowcaseExpenses: ExpenseItem[] = [
  {
    id: 'exp-venue-1',
    categoryId: 'venue',
    name: 'Conservatory & Greenhouse Rental',
    estimatedCostMinor: 1100000,
    actualCostMinor: 1050000,
    paidMinor: 500000,
    status: 'confirmed',
    priority: 'must_have',
    notes: 'Includes indoor backup hall and tables',
  },
  {
    id: 'exp-cat-1',
    categoryId: 'catering',
    name: 'Plated 3-Course Dinner & Open Bar',
    estimatedCostMinor: 1200000,
    actualCostMinor: null,
    paidMinor: 0,
    status: 'planned',
    priority: 'must_have',
    notes: 'Estimated $100/guest for 120 guests',
  },
  {
    id: 'exp-photo-1',
    categoryId: 'photography',
    name: 'Full Day Photography & Drone Coverage',
    estimatedCostMinor: 380000,
    actualCostMinor: 350000,
    paidMinor: 100000,
    status: 'confirmed',
    priority: 'must_have',
    notes: 'Deposit paid, timeline verified',
  },
  {
    id: 'exp-decor-1',
    categoryId: 'decor',
    name: 'Botanical Floral Arches & Centerpieces',
    estimatedCostMinor: 250000,
    actualCostMinor: null,
    paidMinor: 0,
    status: 'planned',
    priority: 'nice_to_have',
    notes: 'White roses, eucalyptus, and hanging wisteria',
  },
  {
    id: 'exp-ent-1',
    categoryId: 'entertainment',
    name: 'Acoustic String Duo & Evening DJ',
    estimatedCostMinor: 200000,
    actualCostMinor: null,
    paidMinor: 0,
    status: 'planned',
    priority: 'nice_to_have',
    notes: 'Ceremony acoustic violin and cocktail jazz',
  },
  {
    id: 'exp-inv-1',
    categoryId: 'invitations',
    name: 'Gold Foil Letterpress Invitations',
    estimatedCostMinor: 60000,
    actualCostMinor: 60000,
    paidMinor: 60000,
    status: 'paid',
    priority: 'optional',
    notes: 'Printed and dispatched with RSVP QR codes',
  },
];

export const defaultShowcaseVendors: VendorRecord[] = [
  {
    id: 'v-1',
    name: 'Highland Botanical Estates',
    category: 'venue',
    contactPerson: 'Sarah Jenkins',
    email: 'events@highlandgreenhouse.com',
    phone: '+1 555-234-8891',
    quotedPriceMinor: 1050000,
    status: 'hired',
    notes: 'Contract confirmed, load-in begins at 9:00 AM.',
  },
  {
    id: 'v-2',
    name: 'Artisanal Hearth Catering',
    category: 'catering',
    contactPerson: 'Chef Marcus Vance',
    email: 'marcus@hearthcatering.com',
    phone: '+1 555-891-2309',
    quotedPriceMinor: 1200000,
    status: 'quoted',
    notes: 'Menu tasting scheduled for next month.',
  },
  {
    id: 'v-3',
    name: 'Lumina Wedding Cinematics',
    category: 'photography',
    contactPerson: 'Elena Rostova',
    email: 'elena@luminacinema.com',
    phone: '+1 555-442-9901',
    quotedPriceMinor: 350000,
    status: 'hired',
    notes: 'Standard 8-hour coverage package.',
  },
];

export const defaultShowcaseIdeas: GeneratedEventPlan = {
  concepts: [
    {
      title: 'Botanical Glasshouse Luminary',
      description: 'Lush greenery canopies, trailing ivy arches, warm Edison filament lighting, and intimate acoustic instrumentation creating an ethereal natural atmosphere.',
      estimatedVibe: 'Romantic, Sophisticated & Organic',
      suitability: 'Perfect for estate glasshouses, outdoor conservatories, and botanical gardens.',
    },
    {
      title: 'Modern Minimalist Velvet',
      description: 'Structured calla lily arrangements, geometric brass accents, rich emerald velvet linens, and customized signature gin cocktails.',
      estimatedVibe: 'High-Fashion, Sleek & Contemporary',
      suitability: 'Ideal for modern gallery spaces and urban loft celebrations.',
    },
  ],
  themes: [
    {
      name: 'Emerald Forest & Champagne Gold',
      colorPalette: ['#064E3B', '#D97706', '#F8FAFC', '#1F2937'],
      decorIdeas: ['Eucalyptus table runners', 'Champagne silk accents', 'Gold metallic charger plates'],
      vibe: 'Refined botanical opulence',
    },
    {
      name: 'Celestial Twilight & Ivory',
      colorPalette: ['#1E1B4B', '#9333EA', '#F3F4F6', '#030712'],
      decorIdeas: ['Star-projection canopy', 'Midnight velvet napkins', 'White floral chandeliers'],
      vibe: 'Enchanted evening celebration',
    },
  ],
  menu: [
    { course: 'Hors d’oeuvres', item: 'Truffled Wild Mushroom Tartlets', dietaryNotes: 'Vegetarian & Nut-Free', description: 'Crisp pastry filled with caramelized leeks and thyme-infused wild mushrooms.' },
    { course: 'Main Entrée', item: 'Herb-Roasted Chilean Sea Bass or Filet Mignon', dietaryNotes: 'Gluten-Free & Dairy-Free', description: 'Accompanied by garlic parsnip silk and roasted heirloom carrots.' },
    { course: 'Dessert', item: 'Artisanal Matcha Vanilla Bean Sponge Cake', dietaryNotes: 'Organic & Vegetarian', description: 'Filled with white chocolate mousse and raspberry reduction.' },
  ],
  entertainment: [
    { type: 'Acoustic String Duo', description: 'Classical and modern romantic melodies during guest arrival and ceremony processional.', estimatedCostTier: 'moderate' },
    { type: 'Live 5-Piece Jazz / Dance Band', description: 'Seamless blend of Motown classics, modern pop, and energetic dance anthems.', estimatedCostTier: 'luxury' },
  ],
  recommendedTasks: [
    { title: 'Confirm Floral Mockups with Florist', description: 'Inspect mockup table arrangements for height and lighting', category: 'decor', daysBeforeEvent: 45, priority: 'nice_to_have', milestone: '1.5 Months Before' },
  ],
  recommendedExpenses: [
    { categoryId: 'venue', name: 'Venue Rental Fee', estimatedCostMinor: 1100000, priority: 'must_have' },
    { categoryId: 'catering', name: 'Dinner & Open Bar', estimatedCostMinor: 1200000, priority: 'must_have' },
  ],
  aiAssumptions: [
    'Budget figures reflect verified median regional prices for quality licensed vendors.',
    'Guest count calculations assume 120 adult dinner portions and continuous beverage service.',
  ],
};

/**
 * Creates the default initial showcase event plan state.
 */
export function createDefaultEventPlanState(): EventPlanState {
  return {
    event: defaultShowcaseEvent,
    expenses: defaultShowcaseExpenses,
    tasks: deriveTasksFromEvent(defaultShowcaseEvent),
    vendors: defaultShowcaseVendors,
    guests: defaultShowcaseGuests,
    activeProposal: null,
    activeScenarioImpact: null,
    generatedIdeas: defaultShowcaseIdeas,
  };
}
