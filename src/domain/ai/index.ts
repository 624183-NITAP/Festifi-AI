/**
 * FestiFi AI — Unified AI Provider Module
 * Cleanly facade that separates client-safe deterministic providers from server-side live Gemini providers.
 */

import { DeterministicDemoAIProvider, IAIProvider } from './deterministic';
import { GeminiAIProvider } from './geminiProvider';
import { VendorInquiryResult } from '../vendors';

export { DeterministicDemoAIProvider, GeminiAIProvider };
export type { IAIProvider, VendorInquiryResult };
export * from './copilot';

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
