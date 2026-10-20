/**
 * FestiFi AI — Request Validation & Security Middleware
 * Centralized verification for all server-side API endpoints:
 * - Token Bucket Rate Limiting (HTTP 429)
 * - Content-Type enforcement (HTTP 415)
 * - Content-Length / DoS size enforcement (HTTP 413)
 * - Malformed JSON handling (HTTP 400)
 * - Strict Zod runtime schema validation (HTTP 400)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitResult } from './rateLimiter';

export interface ValidatedRequest<T> {
  data?: T;
  errorResponse?: NextResponse;
}

export interface ValidationSchema<T> {
  safeParse: (data: unknown) =>
    | { success: true; data: T }
    | { success: false; error: { flatten: () => unknown } };
}

export interface ValidateOptions {
  rateLimitCapacity?: number;
  refillRatePerSecond?: number;
  maxBytes?: number;
}

export async function validateAIRequest<T>(
  req: NextRequest,
  schema: ValidationSchema<T>,
  options: ValidateOptions = {}
): Promise<ValidatedRequest<T>> {
  const {
    rateLimitCapacity = 20,
    refillRatePerSecond = 0.33,
    maxBytes = 256 * 1024, // 256 KB
  } = options;

  // 1. Client IP normalization & Rate limiting
  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const clientIp = rawIp || '127.0.0.1';
  const rateLimit: RateLimitResult = checkRateLimit(clientIp, rateLimitCapacity, refillRatePerSecond);

  if (!rateLimit.allowed) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please wait before making another request.',
          retryAfter: rateLimit.resetInSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.resetInSeconds) },
        }
      ),
    };
  }

  // 2. Enforce Content-Type: application/json
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Unsupported Media Type: Request must have Content-Type: application/json',
        },
        { status: 415 }
      ),
    };
  }

  // 3. Enforce Content-Length (DoS prevention against memory exhaustion)
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > maxBytes) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Payload Too Large: Request body exceeds maximum allowed size of ${Math.round(maxBytes / 1024)} KB`,
        },
        { status: 413 }
      ),
    };
  }

  // 4. Safely parse JSON body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Malformed JSON payload in request body',
        },
        { status: 400 }
      ),
    };
  }

  // 5. Strict runtime schema validation
  const validation = schema.safeParse(rawBody);
  if (!validation.success) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: validation.error.flatten(),
        },
        { status: 400 }
      ),
    };
  }

  return { data: validation.data };
}
