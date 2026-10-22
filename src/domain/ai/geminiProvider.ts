/**
 * FestiFi AI — Google Gemini Live AI Provider
 * Communicates with Gemini API on the server-side only.
 * Safely parses JSON output and validates against Zod schemas.
 * Automatically falls back to DeterministicDemoAIProvider if offline or on network error.
 */

import { CopilotResultSchema, GeneratedEventPlanSchema } from '../schemas';
import {
  CopilotActionType,
  CopilotResult,
  EventDetails,
  GeneratedEventPlan,
  VendorRecord,
} from '../types';
import { CopilotContext } from './copilot';
import { DeterministicDemoAIProvider, IAIProvider } from './deterministic';
import { VendorInquiryResult } from '../vendors';

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
