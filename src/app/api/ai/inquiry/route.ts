import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/domain/ai';
import { VendorInquiryRequestSchema } from '@/domain/schemas';
import { validateAIRequest } from '@/domain/validation/requestValidator';

export async function POST(req: NextRequest) {
  try {
    const { data, errorResponse } = await validateAIRequest(req, VendorInquiryRequestSchema, {
      rateLimitCapacity: 30,
      refillRatePerSecond: 0.5,
      maxBytes: 256 * 1024,
    });

    if (errorResponse) {
      return errorResponse;
    }

    const { event, vendor, specialRequests } = data!;
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
