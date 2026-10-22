/**
 * FestiFi AI — Deterministic Offline Demo Provider
 * 100% offline, reproducible, rich, context-aware suggestions tailored to each celebration type.
 * Completely safe for client-side and server-side execution with zero external network dependencies.
 */

import { generateDeterministicVendorInquiry, VendorInquiryResult } from '../vendors';
import { GeneratedEventPlanSchema, CopilotResultSchema } from '../schemas';
import {
  CopilotActionType,
  CopilotResult,
  EventDetails,
  GeneratedEventPlan,
  VendorRecord,
} from '../types';
import { executeDeterministicCopilot, CopilotContext } from './copilot';

export interface IAIProvider {
  readonly name: string;
  readonly isLive: boolean;
  generateEventPlan(event: EventDetails): Promise<{ plan: GeneratedEventPlan; provider: string; isLive: boolean }>;
  generateVendorInquiry(
    event: EventDetails,
    vendor: VendorRecord,
    notes?: string
  ): Promise<VendorInquiryResult>;
  executeCopilot(
    context: CopilotContext,
    actionType: CopilotActionType,
    prompt: string
  ): Promise<CopilotResult>;
}

export class DeterministicDemoAIProvider implements IAIProvider {
  readonly name = 'FestiFi Deterministic Demo Engine';
  readonly isLive = false;

  async generateEventPlan(event: EventDetails): Promise<{ plan: GeneratedEventPlan; provider: string; isLive: boolean }> {
    const rawPlan = this.buildTailoredPlan(event);
    // Validate output through Zod schema
    const validated = GeneratedEventPlanSchema.parse(rawPlan);
    return {
      plan: validated,
      provider: this.name,
      isLive: false,
    };
  }

  async executeCopilot(
    context: CopilotContext,
    actionType: CopilotActionType,
    prompt: string
  ): Promise<CopilotResult> {
    const rawResult = executeDeterministicCopilot(context, actionType, prompt);
    const validated = CopilotResultSchema.parse(rawResult);
    return {
      ...validated,
      isLive: false,
      providerName: this.name,
    };
  }

  async generateVendorInquiry(
    event: EventDetails,
    vendor: VendorRecord,
    notes?: string
  ): Promise<VendorInquiryResult> {
    return generateDeterministicVendorInquiry(event, vendor, notes);
  }

  private buildTailoredPlan(event: EventDetails): GeneratedEventPlan {
    const type = event.type;

    if (type === 'wedding') {
      return {
        concepts: [
          {
            title: 'Timeless Botanical Elegance',
            description: 'Lush greenery arches, warm ambient string lighting, neutral ivory linens, and personal acoustic melodies creating an intimate, romantic atmosphere.',
            estimatedVibe: 'Romantic, Sophisticated & Warm',
            suitability: 'Ideal for medium-to-large guest counts in estate or greenhouse settings.',
          },
          {
            title: 'Modern Minimalist Luminary',
            description: 'Monochromatic architectural florals, structured candle arrays, sleek typography signage, and clean culinary presentations emphasizing modern luxury.',
            estimatedVibe: 'Modern, Chic & High-Fashion',
            suitability: 'Perfect for loft spaces, art galleries, and urban venues.',
          },
        ],
        themes: [
          {
            name: 'Champagne, Sage & Warm Ivory',
            colorPalette: ['#E6D5B8', '#9FAF90', '#FFFFFF', '#4A5B43'],
            decorIdeas: ['Eucalyptus table runners', 'Floating taper candles', 'Champagne silk chair accents', 'Gold metallic charger plates'],
            vibe: 'Organic luxury and botanical serenity',
          },
          {
            name: 'Midnight Velvet & Celestial Gold',
            colorPalette: ['#1B263B', '#E0A96D', '#F4F1DE', '#0D1B2A'],
            decorIdeas: ['Deep navy velvet napkins', 'Star-illumination ceiling projection', 'Brass geometric centerpieces'],
            vibe: 'Dramatic evening glamour',
          },
        ],
        menu: [
          { course: 'Hors d’Oeuvres', item: 'Truffle Arancini & Smoked Salmon Blinis', dietaryNotes: 'Gluten-Free upon request', description: 'Passed canapés during cocktail hour on the garden lawn.' },
          { course: 'Plated Main', item: 'Slow-Braised Short Rib or Pan-Seared Chilean Sea Bass', dietaryNotes: 'Gluten-Free, Dairy-Free option', description: 'Served alongside rosemary potato purée and charred asparagus.' },
          { course: 'Dessert & Late Night', item: 'Artisanal Macaron Tower & Espresso Bar', dietaryNotes: 'Nut-Free options labeled', description: 'Interactive dessert station accompanied by specialty barista drinks.' },
        ],
        entertainment: [
          { type: 'Acoustic String Duo', description: 'Live violin and cello performance covering classical and modern romantic melodies during ceremony and cocktails.', estimatedCostTier: 'moderate' },
          { type: 'Live 5-Piece Jazz / Dance Band', description: 'Energetic reception music spanning Motown, swing, and modern chart-toppers.', estimatedCostTier: 'luxury' },
        ],
        recommendedTasks: [
          { title: 'Lock Venue & Conservatory Contract', description: 'Secure ceremony and reception permits and confirm rain contingency halls', category: 'venue', daysBeforeEvent: 180, priority: 'must_have', milestone: '6 Months Before' },
          { title: 'Book Photographer & Videographer', description: 'Finalize shot list, golden-hour schedule, and drone flyover permissions', category: 'photography', daysBeforeEvent: 150, priority: 'must_have', milestone: '5 Months Before' },
          { title: 'Tasting & Menu Finalization', description: 'Sample main courses, confirm wine pairings, and review dietary allergens', category: 'catering', daysBeforeEvent: 90, priority: 'must_have', milestone: '3 Months Before' },
          { title: 'Send Formal Invitations & RSVP Cards', description: 'Mail letterpress suites with RSVP deadlines and dietary intake forms', category: 'invitations', daysBeforeEvent: 60, priority: 'must_have', milestone: '2 Months Before' },
        ],
        recommendedExpenses: [
          { categoryId: 'venue', name: 'Estate Venue & Conservatory Space Hire', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.32), priority: 'must_have' },
          { categoryId: 'catering', name: 'Plated 3-Course Dinner, Cocktail Hour & Open Bar', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.34), priority: 'must_have' },
          { categoryId: 'photography', name: 'Full-Day Photo & 4K Cinema Drone Coverage', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.11), priority: 'must_have' },
          { categoryId: 'decor', name: 'Ceremony Arch, Hanging Canopies & Centerpieces', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.08), priority: 'nice_to_have' },
          { categoryId: 'entertainment', name: 'Ceremony Strings & Evening Reception Band/DJ', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.07), priority: 'nice_to_have' },
          { categoryId: 'invitations', name: 'Letterpress Invitation Suites & Calligraphy', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.02), priority: 'optional' },
          { categoryId: 'logistics', name: 'Guest Shuttles & Event Valet Service', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.03), priority: 'nice_to_have' },
          { categoryId: 'miscellaneous', name: 'Contingency Cash Reserve & Gratuities', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.03), priority: 'must_have' },
        ],
        aiAssumptions: [
          'Calculations reflect median vendor rates for professional weekend reservations.',
          'Assumes 15% catering contingency cushion for seasonal ingredient adjustments.',
          'Guest transportation assumes central pickup within 15 miles of venue.',
        ],
      };
    }

    if (type === 'birthday') {
      return {
        concepts: [
          {
            title: 'Electric Neon Rooftop Soirée',
            description: 'Vibrant LED accents, custom neon signage, high-energy live DJ, signature craft mixology, and interactive photobooths.',
            estimatedVibe: 'Electric, Energetic & Celebratory',
            suitability: 'Ideal for milestone birthdays (30th, 40th, 50th) and urban celebrations.',
          },
        ],
        themes: [
          {
            name: 'Sunset Magenta & Cyber Amber',
            colorPalette: ['#FF007F', '#FFA500', '#2E0854', '#FFFFFF'],
            decorIdeas: ['Custom LED script name sign', 'Holographic balloon garlands', 'Glow cocktail stirrers'],
            vibe: 'High-energy celebration glam',
          },
        ],
        menu: [
          { course: 'Interactive Small Plates', item: 'Gourmet Sliders, Bao Buns & Truffle Fries', dietaryNotes: 'Vegetarian and vegan options', description: 'Passed roaming appetizers kept hot throughout the night.' },
          { course: 'Signature Birthday Dessert', item: 'Tiered Geometric Funfetti Cake & Mini Cupcakes', dietaryNotes: 'Dairy-Free option labeled', description: 'Spectacular centerpiece cake cutting with sparklers.' },
        ],
        entertainment: [
          { type: 'Open-Format Club DJ & Saxophonist', description: 'Curated mix of house, throwback hits, and live brass improvisation.', estimatedCostTier: 'moderate' },
          { type: '360 Glam Video Booth', description: 'High-speed revolving camera with instant guest social sharing.', estimatedCostTier: 'budget' },
        ],
        recommendedTasks: [
          { title: 'Reserve Rooftop Lounge or Private Hall', description: 'Confirm sound curfew, beverage minimums, and security deposit', category: 'venue', daysBeforeEvent: 45, priority: 'must_have', milestone: '6 Weeks Before' },
          { title: 'Commission Custom Cake & Neon Sign', description: 'Finalize design sketches, flavors, and delivery logistics', category: 'decor', daysBeforeEvent: 30, priority: 'nice_to_have', milestone: '1 Month Before' },
          { title: 'Release Digital Invitations & RSVP Tracker', description: 'Track headcount and song requests through digital RSVP', category: 'invitations', daysBeforeEvent: 21, priority: 'must_have', milestone: '3 Weeks Before' },
        ],
        recommendedExpenses: [
          { categoryId: 'venue', name: 'Private Rooftop / Lounge Venue Rental', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.38), priority: 'must_have' },
          { categoryId: 'catering', name: 'Hors d’Oeuvres, Open Bar & Custom Cake', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.35), priority: 'must_have' },
          { categoryId: 'entertainment', name: 'DJ Sound Kit & 360 Video Booth', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.15), priority: 'must_have' },
          { categoryId: 'decor', name: 'Custom Neon Sign, Balloons & Photo Backdrop', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.08), priority: 'nice_to_have' },
          { categoryId: 'photography', name: 'Roaming Party Photographer (3 Hours)', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.04), priority: 'nice_to_have' },
        ],
        aiAssumptions: [
          'Assumes 3 to 4 hours of bar service and cocktail-style roaming catering.',
          'Venue includes existing state-of-the-art house sound system.',
        ],
      };
    }

    if (type === 'community') {
      return {
        concepts: [
          {
            title: 'Civic Unity Festival & Open-Air Market',
            description: 'Accessible community park setup, live regional performers, interactive family craft zones, civic awards, and diverse local street food trucks.',
            estimatedVibe: 'Warm, Inclusive, Dynamic & Festive',
            suitability: 'Ideal for city squares, civic parks, and neighborhood cultural festivals.',
          },
          {
            title: 'Green Earth Sustainable Gathering',
            description: 'Eco-conscious workshops, organic farmers market, children obstacle courses, and acoustic folk music.',
            estimatedVibe: 'Clean, Educational & Uplifting',
            suitability: 'Ideal for daylight community gatherings and park spaces.',
          },
        ],
        themes: [
          {
            name: 'Kaleidoscope Community Rainbow',
            colorPalette: ['#E63946', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'],
            decorIdeas: ['Colorful fabric bunting', 'Recycled craft flags', 'Accessible picnic shade umbrellas'],
            vibe: 'Welcoming community joy',
          },
        ],
        menu: [
          { course: 'Festival Food Stalls', item: 'Diverse Local Food Trucks & Street Carts', dietaryNotes: 'Strict allergen labeling & vegan options', description: 'Curated roster of independent local culinary vendors.' },
          { course: 'Community Refreshments', item: 'Hydration Stations & Fresh Lemonade', dietaryNotes: 'Complimentary water refill points', description: 'Eco-friendly water refill stations preventing single-use plastic waste.' },
        ],
        entertainment: [
          { type: 'Community Showcase Stage', description: 'Local youth dance troupes, civic choir, and acoustic bands.', estimatedCostTier: 'budget' },
          { type: 'Children Activity & Crafts Zone', description: 'Face painting, balloon twisting, and collaborative chalk mural.', estimatedCostTier: 'budget' },
        ],
        recommendedTasks: [
          { title: 'Submit Park & Street Permits', description: 'Obtain civic authorizations, sound waiver, and fire safety clearance', category: 'permits', daysBeforeEvent: 60, priority: 'must_have', milestone: '2 Months Before' },
          { title: 'Book First Aid Team & Waste Management', description: 'Station certified EMTs and recycling bins', category: 'logistics', daysBeforeEvent: 30, priority: 'must_have', milestone: '1 Month Before' },
        ],
        recommendedExpenses: [
          { categoryId: 'logistics', name: 'Permits, Insurance, Waste & Portables', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.35), priority: 'must_have' },
          { categoryId: 'entertainment', name: 'Stage, Sound System & Technicians', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.25), priority: 'must_have' },
          { categoryId: 'decor', name: 'Signage, Directional Banners & Shade', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.15), priority: 'must_have' },
          { categoryId: 'invitations', name: 'Flyers, Posters & Digital Community Ads', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.10), priority: 'must_have' },
        ],
        aiAssumptions: [
          'Assumes public community safety compliance, insurance riders, and municipal permit lead times.',
          'Food truck vendors pay their own operations, event budget covers site infrastructure and waste management.',
        ],
      };
    }

    // Default / Corporate / Anniversary / Other
    return {
      concepts: [
        {
          title: 'Signature Executive Showcase',
          description: 'Refined presentation lighting, seamless audio-visual production, curated networking lounges, and gourmet plated dining.',
          estimatedVibe: 'Polished, Impactful & Professional',
          suitability: 'Ideal for conferences, galas, and milestones.',
        },
      ],
      themes: [
        {
          name: 'Navy Blue, Slate & Polished Platinum',
          colorPalette: ['#0B132B', '#1C2541', '#5BC0BE', '#FFFFFF'],
          decorIdeas: ['Illuminated lectern backdrop', 'Sleek frosted acrylic signage', 'Architectural uplighting'],
          vibe: 'Modern prestige and focus',
        },
      ],
      menu: [
        { course: 'Executive Plated Dinner', item: 'Sous-Vide Salmon & Roasted Root Vegetables', dietaryNotes: 'Gluten-Free, Dairy-Free', description: 'Prepared to individual dietary selections.' },
      ],
      entertainment: [
        { type: 'Keynote Speaker & AV Production', description: 'Full professional stage audio, wireless lavaliers, and dual-display projection.', estimatedCostTier: 'moderate' },
      ],
      recommendedTasks: [
        { title: 'Lock Speaker Contracts & Tech Riders', description: 'Confirm travel dates and presentation decks', category: 'entertainment', daysBeforeEvent: 40, priority: 'must_have', milestone: '6 Weeks Before' },
      ],
      recommendedExpenses: [
        { categoryId: 'venue', name: 'Conference / Banquet Hall Rental', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.40), priority: 'must_have' },
        { categoryId: 'catering', name: 'Networking Breakfast & Lunch Buffet', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.30), priority: 'must_have' },
        { categoryId: 'entertainment', name: 'AV Tech, Stage & Live Stream Kit', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.20), priority: 'must_have' },
      ],
      aiAssumptions: [
        'Estimates assume professional AV technicians included on-site during event runtime.',
      ],
    };
  }
}
