import { NextRequest, NextResponse } from 'next/server';
import { generateBudgetOptimization } from '@/domain/budget';
import { OptimizeBudgetRequestSchema } from '@/domain/schemas';
import { validateAIRequest } from '@/domain/validation/requestValidator';

export async function POST(req: NextRequest) {
  try {
    const { data, errorResponse } = await validateAIRequest(req, OptimizeBudgetRequestSchema, {
      rateLimitCapacity: 30,
      refillRatePerSecond: 0.5,
      maxBytes: 256 * 1024,
    });

    if (errorResponse) {
      return errorResponse;
    }

    const { event, expenses } = data!;
    const proposal = generateBudgetOptimization(event, expenses);

    return NextResponse.json({
      success: true,
      data: proposal,
    });
  } catch (err) {
    console.error('API Error in /api/ai/optimize:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { success: false, error: 'Budget optimization failed to compute.' },
      { status: 500 }
    );
  }
}
