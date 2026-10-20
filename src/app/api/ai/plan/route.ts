import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/domain/ai';
import { EventDetailsSchema } from '@/domain/schemas';
import { checkRateLimit } from '@/domain/validation/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const rateLimit = checkRateLimit(clientIp, 20, 0.33);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please wait before generating another plan.',
          retryAfter: rateLimit.resetInSeconds,
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
      );
    }

    // 2. Validate payload size and parse JSON
    const body = await req.json();

    // 3. Strict schema validation
    const validationResult = EventDetailsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid event configuration',
          validationIssues: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    // 4. Delegate to AI Provider
    const provider = getAIProvider();
    const result = await provider.generateEventPlan(validationResult.data);

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
