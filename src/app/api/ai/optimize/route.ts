import { NextRequest, NextResponse } from 'next/server';
import { generateBudgetOptimization } from '@/domain/budget';
import { OptimizeBudgetRequestSchema } from '@/domain/schemas';
import { checkRateLimit } from '@/domain/validation/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const rateLimit = checkRateLimit(clientIp, 30, 0.5);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = OptimizeBudgetRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid budget optimization parameters',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { event, expenses } = validation.data;
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
