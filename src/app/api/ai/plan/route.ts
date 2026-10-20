import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/domain/ai';
import { EventDetailsSchema } from '@/domain/schemas';
import { validateAIRequest } from '@/domain/validation/requestValidator';

export async function POST(req: NextRequest) {
  try {
    const { data: event, errorResponse } = await validateAIRequest(req, EventDetailsSchema, {
      rateLimitCapacity: 20,
      refillRatePerSecond: 0.33,
      maxBytes: 256 * 1024,
    });

    if (errorResponse) {
      return errorResponse;
    }

    // Delegate to AI Provider
    const provider = getAIProvider();
    const result = await provider.generateEventPlan(event!);

    return NextResponse.json({
      success: true,
      data: result.plan,
      meta: {
        provider: result.provider,
        isLive: result.isLive,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    // 5. Safe error response: NEVER expose internal stack trace or credentials
    console.error('API Error in /api/ai/plan:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while generating the celebration plan. Please try again.',
      },
      { status: 500 }
    );
  }
}
