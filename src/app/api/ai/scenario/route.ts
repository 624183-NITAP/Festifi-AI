import { NextRequest, NextResponse } from 'next/server';
import { simulateScenario } from '@/domain/scenarios';
import { SimulateScenarioRequestSchema } from '@/domain/schemas';
import { checkRateLimit } from '@/domain/validation/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const rateLimit = checkRateLimit(clientIp, 40, 1.0);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Malformed JSON payload in request body',
        },
        { status: 400 }
      );
    }
    const validation = SimulateScenarioRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid scenario simulation parameters',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { scenarioType, event, expenses, scenarioParams } = validation.data;
    const impact = simulateScenario(event, expenses, scenarioType, scenarioParams);

    return NextResponse.json({
      success: true,
      data: impact,
    });
  } catch (err) {
    console.error('API Error in /api/ai/scenario:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { success: false, error: 'Scenario simulation failed to compute.' },
      { status: 500 }
    );
  }
}
