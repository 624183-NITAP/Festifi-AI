import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/domain/ai';
import { AICopilotRequestSchema } from '@/domain/schemas';
import { validateAIRequest } from '@/domain/validation/requestValidator';

export async function POST(req: NextRequest) {
  try {
    const { data, errorResponse } = await validateAIRequest(req, AICopilotRequestSchema, {
      rateLimitCapacity: 25,
      refillRatePerSecond: 0.5,
      maxBytes: 256 * 1024,
    });

    if (errorResponse) {
      return errorResponse;
    }

    const { actionType, prompt, event, expenses, tasks } = data!;
    const provider = getAIProvider();

    const result = await provider.executeCopilot(
      { event, expenses, tasks },
      actionType,
      prompt
    );

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        provider: result.providerName,
        isLive: result.isLive,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('API Error in /api/ai/copilot:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while executing the AI Copilot request. Please try again.',
      },
      { status: 500 }
    );
  }
}
