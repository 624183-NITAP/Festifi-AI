import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/domain/ai';
import { VendorInquiryRequestSchema } from '@/domain/schemas';
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
    const validation = VendorInquiryRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid vendor inquiry parameters',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { event, vendor, specialRequests } = validation.data;
    const provider = getAIProvider();
    const result = await provider.generateVendorInquiry(event, vendor, specialRequests);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('API Error in /api/ai/inquiry:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { success: false, error: 'Failed to generate vendor inquiry message.' },
      { status: 500 }
    );
  }
}
