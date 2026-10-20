import { NextRequest, NextResponse } from 'next/server';
import { simulateScenario } from '@/domain/scenarios';
import { SimulateScenarioRequestSchema } from '@/domain/schemas';
import { validateAIRequest } from '@/domain/validation/requestValidator';

export async function POST(req: NextRequest) {
  try {
    const { data, errorResponse } = await validateAIRequest(req, SimulateScenarioRequestSchema, {
      rateLimitCapacity: 40,
      refillRatePerSecond: 1.0,
      maxBytes: 256 * 1024,
    });

    if (errorResponse) {
      return errorResponse;
    }

    const { scenarioType, event, expenses, scenarioParams } = data!;
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
