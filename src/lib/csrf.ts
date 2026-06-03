/**
 * CSRF protection utilities.
 *
 * Uses Double Submit Cookie pattern:
 * - Token is stored in a signed cookie (csrf-token)
 * - Client must send the same token in X-CSRF-Token header
 * - Server validates that header matches the cookie value
 *
 * This prevents CSRF because:
 * - Attacker cannot read the httpOnly cookie
 * - Attacker cannot set custom headers cross-origin (CORS)
 * - SameSite=Strict provides defense-in-depth
 */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function base64urlEncode(data: string | Uint8Array): string {
  const str = typeof data === 'string' ? data : String.fromCharCode(...new Uint8Array(data));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): string {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

async function signToken(rawToken: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is required for CSRF protection');
  }

  const timestamp = Date.now();

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(rawToken + timestamp.toString())
  );
  const signatureB64 = base64urlEncode(new Uint8Array(signature));

  const payload = base64urlEncode(JSON.stringify({ csrf: rawToken, iat: timestamp }));
  return `${payload}.${signatureB64}`;
}

async function verifyToken(token: string): Promise<{ csrf: string } | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const [payloadB64, signatureB64] = token.split('.');
  if (!payloadB64 || !signatureB64) return null;

  let payload: { csrf: string; iat: number };
  try {
    payload = JSON.parse(base64urlDecode(payloadB64));
  } catch {
    return null;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const sigBytes = new Uint8Array(
    base64urlDecode(signatureB64).split('').map(c => c.charCodeAt(0))
  );

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    encoder.encode(payload.csrf + payload.iat.toString())
  );
  if (!isValid) return null;

  if (Date.now() - payload.iat > CSRF_TOKEN_TTL_MS) return null;
  return { csrf: payload.csrf };
}

/**
 * Generate a new CSRF token and set it as a cookie.
 * Returns the raw token value for the client to use.
 * Uses next/headers cookies() — suitable for server components and API routes.
 */
export async function generateCsrfToken(): Promise<string> {
  const rawToken = crypto.randomUUID();
  const token = await signToken(rawToken);

  const cookieStore = await cookies();
  // HttpOnly signed cookie — used for server-side validation
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_TOKEN_TTL_MS / 1000,
  });
  // Non-httpOnly cookie — client reads this to send back in X-CSRF-Token header
  cookieStore.set(`${CSRF_COOKIE_NAME}-raw`, rawToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_TOKEN_TTL_MS / 1000,
  });

  return rawToken;
}

/**
 * Generate CSRF token and set cookies via response headers.
 * Edge-runtime compatible — does not use next/headers cookies().
 * Returns { rawToken, setCookieHeaders } — caller must add headers to response.
 */
export async function generateCsrfTokenEdge(): Promise<{ rawToken: string; setCookieHeaders: string[] }> {
  const rawToken = crypto.randomUUID();
  const token = await signToken(rawToken);

  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  const maxAge = CSRF_TOKEN_TTL_MS / 1000;

  const setCookieHeaders = [
    `${CSRF_COOKIE_NAME}=${token}; HttpOnly; ${secureFlag}SameSite=Strict; Path=/; Max-Age=${maxAge}`,
    `${CSRF_COOKIE_NAME}-raw=${rawToken}; ${secureFlag}SameSite=Strict; Path=/; Max-Age=${maxAge}`,
  ];

  return { rawToken, setCookieHeaders };
}

/**
 * Validate the CSRF token from the request.
 * Checks that the X-CSRF-Token header matches the signed cookie.
 * Returns true if valid, false otherwise.
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  const payload = await verifyToken(cookieToken);
  if (!payload) return false;

  return payload.csrf === headerToken;
}

/**
 * Parse a cookie string and get a specific cookie value.
 * Works in Edge runtime where `cookies()` from next/headers may not be available.
 */
export function getCookieFromHeader(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.trim().split('=');
    if (key === name) {
      return rest.join('=');
    }
  }
  return undefined;
}

/**
 * Validate CSRF token using only the request object (Edge runtime compatible).
 * Reads the raw cookie value from the Cookie header and compares with X-CSRF-Token header.
 */
export function validateCsrfTokenEdge(request: Request): boolean {
  const rawCookieToken = getCookieFromHeader(request, `${CSRF_COOKIE_NAME}-raw`);
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!rawCookieToken || !headerToken) {
    return false;
  }

  return rawCookieToken === headerToken;
}

/**
 * Create a NextResponse that rejects the request due to invalid CSRF token.
 */
export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { success: false, error: 'CSRF validation failed' },
    { status: 403 }
  );
}

/**
 * HTTP methods that require CSRF protection (state-changing operations).
 */
export const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

/**
 * Check if an HTTP method requires CSRF protection.
 */
export function isCsrfProtectedMethod(method: string): boolean {
  return (CSRF_PROTECTED_METHODS as readonly string[]).includes(method.toUpperCase());
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
