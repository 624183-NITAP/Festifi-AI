/**
 * FestiFi AI — Request Validation & Security Middleware
 * Centralized verification for all server-side API endpoints:
 * - Token Bucket Rate Limiting (HTTP 429) with proxy trust & IP validation
 * - Content-Type enforcement (HTTP 415)
 * - Stream-bounded body consumption & Content-Length enforcement (HTTP 413)
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
  trustProxy?: boolean;
  trustedHops?: number;
}

/**
 * Validates whether a given string is a valid IPv4 or IPv6 address.
 * Rejects header injection, malformed strings, or unexpected tokens.
 */
export function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const trimmed = ip.trim();
  // Standard IPv4: 4 octets between 0 and 255
  const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
  if (ipv4.test(trimmed)) return true;

  // Standard IPv6 (basic RFC-compliant format check)
  const ipv6 = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::1$|^::$|^([a-fA-F0-9]{1,4}:){1,7}:|^:([a-fA-F0-9]{1,4}:){1,7}$|^(?:[a-fA-F0-9]{1,4}:){1,6}:[a-fA-F0-9]{1,4}$/;
  return ipv6.test(trimmed);
}

/**
 * Resolves the client IP address considering proxy trust and header spoofing protections.
 *
 * PROXY TRUST STRATEGY:
 * - If `trustProxy` is false: client-supplied headers (x-forwarded-for) are ignored completely,
 *   falling back to connection socket IP or loopback to prevent spoofed IP rate limit bypass.
 * - If `trustProxy` is true: x-forwarded-for is split and every token is strictly verified as a valid IP.
 *   If any token is malformed, the header is discarded.
 *   The IP is extracted by counting backward from the end by `trustedHops` (default 1),
 *   ensuring that client-prepended spoofed IPs are ignored and the upstream reverse proxy's
 *   reported client IP is selected.
 */
export function resolveClientIp(
  req: NextRequest,
  options: { trustProxy?: boolean; trustedHops?: number } = {}
): string {
  const trustProxy =
    options.trustProxy ??
    (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'test');

  if (trustProxy) {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) {
      const tokens = xff
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Verify all tokens are strictly valid IP addresses to prevent header injection
      const allValid = tokens.length > 0 && tokens.every(isValidIp);
      if (allValid) {
        const trustedHops = Math.max(1, options.trustedHops ?? Number(process.env.TRUSTED_PROXY_HOPS || 1));
        const targetIndex = Math.max(0, tokens.length - trustedHops);
        return tokens[targetIndex];
      }
    }
  }

  // Fallback to socket edge connection IP if present and valid
  const directIp = req.ip;
  if (directIp && isValidIp(directIp)) {
    return directIp;
  }

  return '127.0.0.1';
}

/**
 * Safely reads the request body stream up to maxBytes.
 * Cancels stream reading early if total received bytes exceed maxBytes,
 * preventing memory exhaustion attacks from chunked or understated-length bodies.
 */
export async function readStreamWithLimit(
  req: NextRequest,
  maxBytes: number
): Promise<{ bodyText?: string; error?: 'too_large' | 'malformed' }> {
  // If no body exists
  if (!req.body) {
    try {
      const text = await req.text();
      return { bodyText: text };
    } catch {
      return { error: 'malformed' };
    }
  }

  if (typeof req.body.getReader === 'function') {
    const reader = req.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.byteLength;
          if (totalBytes > maxBytes) {
            try {
              await reader.cancel('Payload Too Large');
            } catch {
              // Reader cancellation error safely swallowed
            }
            return { error: 'too_large' };
          }
          chunks.push(value);
        }
      }
    } catch {
      if (totalBytes > maxBytes) {
        return { error: 'too_large' };
      }
      return { error: 'malformed' };
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder('utf-8').decode(combined);
    return { bodyText: text };
  }

  // Fallback for runtimes where getReader is not available
  try {
    const text = await req.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      return { error: 'too_large' };
    }
    return { bodyText: text };
  } catch {
    return { error: 'malformed' };
  }
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
    trustProxy,
    trustedHops,
  } = options;

  // 1. Client IP normalization & Rate limiting
  const clientIp = resolveClientIp(req, { trustProxy, trustedHops });
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

  // 3. Enforce Content-Length header if present
  const rawContentLength = req.headers.get('content-length');
  if (rawContentLength !== null) {
    const trimmedCl = rawContentLength.trim();
    if (!/^\d+$/.test(trimmedCl)) {
      return {
        errorResponse: NextResponse.json(
          {
            success: false,
            error: 'Bad Request: Invalid Content-Length header',
          },
          { status: 400 }
        ),
      };
    }
    const contentLength = parseInt(trimmedCl, 10);
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
  }

  // 4. Stream-read request body with strict size capping
  const { bodyText, error: streamError } = await readStreamWithLimit(req, maxBytes);
  if (streamError === 'too_large') {
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

  if (streamError === 'malformed' || !bodyText || bodyText.trim() === '') {
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

  // 5. Parse JSON body
  let rawBody: unknown;
  try {
    rawBody = JSON.parse(bodyText);
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

  // 6. Strict runtime schema validation
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
