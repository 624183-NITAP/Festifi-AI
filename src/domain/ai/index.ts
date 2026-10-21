/**
 * FestiFi AI — AI Provider Abstraction
 * Supports both Google Gemini (Live API) and Deterministic Offline Demo Provider.
 * Enforces structured output validation via Zod schemas, timeout protections,
 * and graceful fallback without corrupting saved user plans.
 */

import {
  CopilotResultSchema,
  GeneratedEventPlanSchema,
} from '../schemas';
import {
  BudgetCategory,
  CopilotActionType,
  CopilotResult,
  EventDetails,
  ExpenseItem,
  GeneratedEventPlan,
  PriorityLevel,
  TimelineTask,
  VendorRecord,
} from '../types';
import { executeDeterministicCopilot, CopilotContext } from './copilot';

export interface VendorInquiryResult {
  inquiryMessage: string;
  checklistTips: string[];
  isAiGenerated: boolean;
  providerName: string;
}

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

/**
 * Deterministic Demo AI Provider
 * 100% offline, reproducible, rich, context-aware suggestions tailored to each celebration type.
 */
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
    const inquiryMessage = [
      `Dear ${vendor.contactPerson || `${vendor.name} Team`},`,
      ``,
      `I am organizing an upcoming ${event.type.replace('_', ' ')} titled "${event.title}" planned for ${event.targetDate} with an estimated guest count of ${event.guestCount}.`,
      ``,
      `We are currently shortlisting trusted partners for our ${vendor.category} needs. We would love to request a formal quotation and inquire about your availability for this date.`,
      notes ? `Specific requirements to keep in mind:\n- ${notes}\n` : '',
      `Could you kindly share:`,
      `1. Your standard package inclusions and itemized pricing.`,
      `2. Minimum deposit terms, cancellation policies, and postponement flexibility.`,
      `3. Load-in, setup, and teardown logistics schedule.`,
      ``,
      `Thank you so much for your time and guidance. We look forward to your response!`,
      ``,
      `Warm regards,`,
      `Event Planning Team — ${event.title}`,
    ].filter(Boolean).join('\n');

    const checklistTips = [
      `Request proof of commercial general liability insurance for venue compliance.`,
      `Confirm overtime hourly rates in writing before signing the contract.`,
      `Ensure cancellation policy explicitly addresses weather disruptions and forced rescheduling.`,
      `Clarify dietary allergen handling protocol and kitchen cross-contact guarantees.`,
    ];

    return {
      inquiryMessage,
      checklistTips,
      isAiGenerated: false,
      providerName: 'FestiFi Deterministic Template Engine',
    };
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
          { course: 'Hors d’oeuvres', item: 'Truffled Wild Mushroom Crostini & Seared Scallops', dietaryNotes: 'Vegetarian & Gluten-Free Options Available', description: 'Bite-sized welcoming appetizers passed during cocktail hour.' },
          { course: 'Main Entrée', item: 'Herb-Crusted Filet Mignon or Pan-Roasted Halibut', dietaryNotes: 'Gluten-Free, Dairy-Free on request', description: 'Served alongside truffled potato puree and seasonal roasted asparagus.' },
          { course: 'Dessert', item: 'Artisanal Tiered Wedding Cake & Berry Coulis', dietaryNotes: 'Nut-Free Kitchen Guaranteed', description: 'Vanilla bean sponge layered with raspberry compote and Swiss meringue buttercream.' },
        ],
        entertainment: [
          { type: 'Live String Quartet for Ceremony', description: 'Classical and acoustic contemporary pop arrangements during guest arrival and processional.', estimatedCostTier: 'moderate' },
          { type: 'Dynamic 5-Piece Party Band & DJ Hybrid', description: 'Energetic live instruments blended with seamless DJ mixing for dancing.', estimatedCostTier: 'luxury' },
          { type: 'Interactive Mirror Photo Booth', description: 'Custom instant photo prints with digital SMS sharing and custom frame branding.', estimatedCostTier: 'budget' },
        ],
        recommendedTasks: [
          { title: 'Schedule Menu & Cake Tasting', description: 'Finalize dietary requirements and dessert portions with caterer', category: 'catering', daysBeforeEvent: 90, priority: 'must_have', milestone: '3 Months Before' },
          { title: 'Finalize Floral Mockups & Centerpieces', description: 'Inspect mock table settings with florist for height and lighting', category: 'decor', daysBeforeEvent: 45, priority: 'nice_to_have', milestone: '1.5 Months Before' },
          { title: 'Create Ceremony Program & Seating Chart', description: 'Confirm print orders and accessible seating paths', category: 'invitations', daysBeforeEvent: 20, priority: 'must_have', milestone: '3 Weeks Before' },
        ],
        recommendedExpenses: [
          { categoryId: 'venue', name: 'Ceremony & Reception Space Fee', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.35), priority: 'must_have' },
          { categoryId: 'catering', name: 'Full Dinner Catering & Open Bar', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.30), priority: 'must_have' },
          { categoryId: 'photography', name: 'Full-Day Photo & Video Coverage', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.12), priority: 'must_have' },
          { categoryId: 'decor', name: 'Florals, Arch & Ambient Lighting', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.08), priority: 'nice_to_have' },
          { categoryId: 'entertainment', name: 'Band / DJ Sound Equipment', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.07), priority: 'must_have' },
        ],
        aiAssumptions: [
          'Budget allocations assume standard 10-15% regional sales tax and standard 18-20% service gratuity.',
          'Vendor estimates reflect verified standard median prices for quality event professionals.',
          'Guest per-head metrics account for adult dinner portions and beverage service.',
        ],
      };
    }

    if (type === 'birthday') {
      return {
        concepts: [
          {
            title: 'Neon Retro Arcade & Glow Lounge',
            description: 'Vibrant LED lighting installations, retro arcade cabinets, custom neon sign photo opportunities, and upbeat synthwave tracks.',
            estimatedVibe: 'High-Energy, Playful & Electric',
            suitability: 'Perfect for milestone birthdays (18th, 21st, 30th, 40th).',
          },
          {
            title: 'Sunset Garden Cocktail Fiesta',
            description: 'Fairy lights strung across open pergola, acoustic guitar rhythms, craft mixology stations, and artisanal small bites.',
            estimatedVibe: 'Relaxed, Sophisticated & Social',
            suitability: 'Ideal for outdoor garden venues, terrace patios, or intimate backyards.',
          },
        ],
        themes: [
          {
            name: 'Electric Neon Nights',
            colorPalette: ['#FF007F', '#00F0FF', '#7000FF', '#0D0221'],
            decorIdeas: ['Custom LED name neon sign', 'Glow-in-the-dark cocktail garnishes', 'Iridescent balloons'],
            vibe: 'Futuristic party celebration',
          },
          {
            name: 'Terracotta Sunset Garden',
            colorPalette: ['#E07A5F', '#F4F1DE', '#3D405A', '#81B29A'],
            decorIdeas: ['Earthen clay pottery with pampas grass', 'Fairy light canopy', 'Wood grain cocktail tables'],
            vibe: 'Warm bohemian social',
          },
        ],
        menu: [
          { course: 'Finger Foods', item: 'Gourmet Sliders & Truffle Parmesan Fries', dietaryNotes: 'Halal & Veggie sliders included', description: 'Casual, premium comfort food station.' },
          { course: 'Signature Drink', item: 'Craft Mocktail & Cocktail Flight', dietaryNotes: 'Non-Alcoholic variations prominently featured', description: 'Freshly shaken citrus and berry infusions.' },
          { course: 'Celebration Centerpiece', item: 'Custom Multi-Tier Birthday Cake', dietaryNotes: 'Nut-Free recipe', description: 'Decadent chocolate hazelnut sponge with customized edible cake topper.' },
        ],
        entertainment: [
          { type: 'Live Club / Party DJ', description: 'Curates high-vibe dance tracks tailored to guest age demographic.', estimatedCostTier: 'moderate' },
          { type: '360-Degree Video Booth', description: 'Rotating slow-motion camera with instant video downloads to guest smartphones.', estimatedCostTier: 'moderate' },
        ],
        recommendedTasks: [
          { title: 'Order Signature Birthday Cake', description: 'Lock in cake baker design and delivery window', category: 'catering', daysBeforeEvent: 21, priority: 'must_have', milestone: '3 Weeks Before' },
          { title: 'Design & Order Custom Neon Sign', description: 'Order commemorative backdrop sign for photo station', category: 'decor', daysBeforeEvent: 18, priority: 'optional', milestone: '2.5 Weeks Before' },
          { title: 'Build Shared Music Playlist', description: 'Gather guest favorite songs and brief DJ', category: 'entertainment', daysBeforeEvent: 10, priority: 'nice_to_have', milestone: '1.5 Weeks Before' },
        ],
        recommendedExpenses: [
          { categoryId: 'venue', name: 'Private Lounge or Venue Rental', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.30), priority: 'must_have' },
          { categoryId: 'catering', name: 'Party Buffet, Drinks & Custom Cake', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.35), priority: 'must_have' },
          { categoryId: 'entertainment', name: 'DJ & 360 Video Booth', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.15), priority: 'must_have' },
          { categoryId: 'decor', name: 'Balloons, Lighting & Backdrop', estimatedCostMinor: Math.round(event.totalBudgetMinor * 0.10), priority: 'nice_to_have' },
        ],
        aiAssumptions: [
          'Calculations estimate standard 3 to 4-hour party event duration.',
          'Food quantities calculated for hearty cocktail appetizers rather than sit-down 3-course dinner.',
        ],
      };
    }

    if (type === 'community') {
      return {
        concepts: [
          {
            title: 'Harmony Cultural & Street Festival',
            description: 'Multi-generational gathering highlighting local cultural performances, food stalls, artisan market booths, and interactive arts.',
            estimatedVibe: 'Inclusive, Festive & Heartwarming',
            suitability: 'Perfect for public parks, civic plazas, and school fairgrounds.',
          },
          {
            title: 'Neighborhood Wellness & Sustainability Fair',
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

/**
 * Google Gemini Live AI Provider
 * Communicates with Gemini API on the server-side only.
 * Safely parses JSON output and validates against GeneratedEventPlanSchema.
 * Automatically falls back to DeterministicDemoAIProvider if offline or on network error.
 */
export class GeminiAIProvider implements IAIProvider {
  readonly name: string;
  readonly isLive = true;
  readonly model: string;
  private readonly apiKey: string;
  private readonly fallbackProvider: DeterministicDemoAIProvider;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey.trim();
    this.model = model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    this.name = `Google Gemini (${this.model})`;
    this.fallbackProvider = new DeterministicDemoAIProvider();
  }

  async generateEventPlan(event: EventDetails): Promise<{ plan: GeneratedEventPlan; provider: string; isLive: boolean }> {
    if (!this.apiKey) {
      const fallback = await this.fallbackProvider.generateEventPlan(event);
      return {
        plan: fallback.plan,
        provider: `${this.fallbackProvider.name} (Fallback: Missing API Key)`,
        isLive: false,
      };
    }

    const prompt = `
You are the world-class event planner FestiFi AI.
Generate a structured, creative event plan for the following event:
- Title: "${event.title}"
- Type: ${event.type}
- Target Date: ${event.targetDate}
- Guest Count: ${event.guestCount}
- Currency: ${event.currency}
- Total Budget in minor currency units (cents): ${event.totalBudgetMinor}
- Notes/Preferences: "${event.notes || 'None'}"

CRITICAL INSTRUCTIONS:
1. Respond with valid JSON only. No markdown formatting, no code fences, no extra commentary.
2. Structure must match this exact JSON schema:
{
  "concepts": [ { "title": string, "description": string, "estimatedVibe": string, "suitability": string } ],
  "themes": [ { "name": string, "colorPalette": [string, string, string, string], "decorIdeas": [string, string], "vibe": string } ],
  "menu": [ { "course": string, "item": string, "dietaryNotes": string, "description": string } ],
  "entertainment": [ { "type": string, "description": string, "estimatedCostTier": "budget" | "moderate" | "luxury" } ],
  "recommendedTasks": [ { "title": string, "description": string, "category": "venue"|"catering"|"entertainment"|"photography"|"decor"|"attire"|"invitations"|"logistics"|"miscellaneous"|"general", "daysBeforeEvent": integer, "priority": "must_have"|"nice_to_have"|"optional", "milestone": string } ],
  "recommendedExpenses": [ { "categoryId": "venue"|"catering"|"entertainment"|"photography"|"decor"|"attire"|"invitations"|"logistics"|"miscellaneous", "name": string, "estimatedCostMinor": integer, "priority": "must_have"|"nice_to_have"|"optional" } ],
  "aiAssumptions": [ string ]
}
`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000); // 14s timeout

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Gemini API HTTP ${response.status}: Falling back to deterministic provider.`);
        const fallback = await this.fallbackProvider.generateEventPlan(event);
        return {
          plan: fallback.plan,
          provider: `${this.fallbackProvider.name} (Fallback: HTTP ${response.status})`,
          isLive: false,
        };
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        const fallback = await this.fallbackProvider.generateEventPlan(event);
        return {
          plan: fallback.plan,
          provider: `${this.fallbackProvider.name} (Fallback: Empty Response)`,
          isLive: false,
        };
      }

      // Parse JSON safely
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const validated = GeneratedEventPlanSchema.parse(parsed);

      return {
        plan: validated,
        provider: this.name,
        isLive: true,
      };
    } catch (err) {
      console.warn('Gemini AI Provider encountered error, utilizing deterministic fallback safely:', err instanceof Error ? err.message : err);
      const fallback = await this.fallbackProvider.generateEventPlan(event);
      return {
        plan: fallback.plan,
        provider: `${this.fallbackProvider.name} (Fallback: Error Encountered)`,
        isLive: false,
      };
    }
  }

  async generateVendorInquiry(
    event: EventDetails,
    vendor: VendorRecord,
    notes?: string
  ): Promise<VendorInquiryResult> {
    // Uses fallback formatting which produces pristine, validated professional messages
    const res = await this.fallbackProvider.generateVendorInquiry(event, vendor, notes);
    return {
      ...res,
      isAiGenerated: false,
      providerName: `${this.fallbackProvider.name} (Template)`,
    };
  }

  async executeCopilot(
    context: CopilotContext,
    actionType: CopilotActionType,
    prompt: string
  ): Promise<CopilotResult> {
    if (!this.apiKey) {
      return this.fallbackProvider.executeCopilot(context, actionType, prompt);
    }

    const { event, expenses, tasks = [] } = context;

    const geminiPrompt = `
You are the expert FestiFi AI Event Copilot.
The user is requesting assistance for an event with the following context:
- Event: "${event.title}" (${event.type}), Date: ${event.targetDate}, Guests: ${event.guestCount}, Currency: ${event.currency}
- Total Budget in minor currency units (cents): ${event.totalBudgetMinor}
- Expenses count: ${expenses.length} items
- Tasks count: ${tasks.length} milestones
- Action Type: ${actionType}
- User Prompt: "${prompt}"

CRITICAL INSTRUCTIONS:
1. Respond with valid JSON only. No markdown formatting, no code fences, no introductory or concluding text.
2. Structure must match this exact JSON schema:
{
  "actionType": "${actionType}",
  "prompt": string,
  "summary": string,
  "realismAnalysis": {
    "feasibilityScore": integer (0 to 100),
    "status": "realistic" | "moderate_risk" | "high_risk",
    "summary": string,
    "budgetCritique": [ string ],
    "scheduleCritique": [ string ],
    "actionableRecommendations": [ string ]
  } (optional, required if actionType is "realism_audit"),
  "proposedExpenseChanges": [
    {
      "name": string,
      "categoryId": "venue"|"catering"|"entertainment"|"photography"|"decor"|"attire"|"invitations"|"logistics"|"miscellaneous",
      "estimatedCostMinor": integer,
      "deltaMinor": integer,
      "action": "update" | "add" | "remove",
      "rationale": string
    }
  ] (optional),
  "proposedTaskChanges": [
    {
      "title": string,
      "description": string,
      "category": "venue"|"catering"|"entertainment"|"photography"|"decor"|"attire"|"invitations"|"logistics"|"miscellaneous"|"general"|"permits"|"rsvp",
      "daysBeforeEvent": integer,
      "priority": "must_have"|"nice_to_have"|"optional",
      "milestone": string,
      "action": "add" | "update" | "remove",
      "rationale": string
    }
  ] (optional),
  "proposedEventChanges": {
    "totalBudgetMinor": integer,
    "contingencyPercentage": number,
    "targetDate": "YYYY-MM-DD",
    "notes": string
  } (optional),
  "tradeoffs": [
    { "item": string, "change": string, "reason": string, "savingsMinor": integer }
  ] (optional)
}
`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000); // 14s timeout

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Gemini API HTTP ${response.status} on Copilot: Falling back to deterministic copilot.`);
        return this.fallbackProvider.executeCopilot(context, actionType, prompt);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        return this.fallbackProvider.executeCopilot(context, actionType, prompt);
      }

      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const validated = CopilotResultSchema.parse(parsed);

      return {
        ...validated,
        isLive: true,
        providerName: this.name,
      };
    } catch (err) {
      console.warn('Gemini Copilot encountered error, utilizing deterministic fallback safely:', err instanceof Error ? err.message : err);
      return this.fallbackProvider.executeCopilot(context, actionType, prompt);
    }
  }
}

/**
 * AI Provider Factory
 * Automatically detects whether live API keys are configured and returns
 * either GeminiAIProvider or DeterministicDemoAIProvider.
 */
export function getAIProvider(): IAIProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (apiKey && apiKey.trim().length > 10 && !apiKey.includes('your_gemini_api_key')) {
    return new GeminiAIProvider(apiKey, model);
  }
  return new DeterministicDemoAIProvider();
}
