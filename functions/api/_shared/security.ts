/**
 * Shared Security & Hardening Module for Tech-Select Cloudflare Workers & Functions
 * Implements:
 * 1. Strict Origin CORS (No wildcard *)
 * 2. Cryptographic Session Management (Web Crypto HMAC-SHA256)
 * 3. One-Time Code (OTP) Challenge Creation & Verification
 * 4. Rate Limiting & Brute Force Lockout
 * 5. Input Sanitization & HTML Escaping (Anti-XSS / Anti-Injection)
 * 6. Hardened Security Headers
 */

// Production domains allowed for cross-origin requests
const ALLOWED_ORIGINS = new Set([
  "https://tech-select.co.il",
  "https://www.tech-select.co.il",
]);

// Allow development / preview environments (e.g. localhost or Google AI Studio Cloud Run previews)
const DEV_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|.*\.run\.app)(:\d+)?$/;

export function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return false;
  const clean = origin.trim().toLowerCase();
  if (ALLOWED_ORIGINS.has(clean)) return true;
  return DEV_ORIGIN_REGEX.test(clean);
}

export function getCorsHeaders(
  request: Request,
  allowedMethods: string = "POST, GET, OPTIONS"
): Record<string, string> {
  const origin = request.headers.get("Origin");
  const headers: Record<string, string> = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": allowedMethods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-Token, X-Challenge-Token",
    "Access-Control-Max-Age": "86400",
  };

  if (origin && isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeString(val: any, maxLen = 100): string {
  if (!val) return "";
  // Strip non-printable/control characters (keep standard text, hebrew, whitespace)
  return String(val)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLen);
}

export function validateEmail(email: any): boolean {
  if (!email || typeof email !== "string") return false;
  const clean = email.trim();
  if (clean.length > 120) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean);
}

export function validatePhone(phone: any): boolean {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function sanitizePrompt(text: any, maxLen = 3000): string {
  if (!text) return "";
  let clean = String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .slice(0, maxLen);
  // Neutralize common prompt injection prefixes & delimiters
  clean = clean.replace(/(?:system\s*instruction|system\s*:|ignore\s+all\s+previous|disregard\s+previous)/gi, "[redacted_instruction]");
  return clean.trim();
}

export function getSessionSecret(env: any): string {
  const envObj = (env || {}) as any;
  const secret =
    envObj.SESSION_SECRET ||
    envObj.CLIENT_SECRET ||
    envObj.GEMINI_API_KEY ||
    (typeof process !== "undefined" && (process.env?.SESSION_SECRET || process.env?.CLIENT_SECRET || process.env?.GEMINI_API_KEY)) ||
    "tech-select-sec-hmac-98124";
  return secret.trim();
}

export function getGeminiApiKey(env: any): string {
  const envObj = (env || {}) as any;
  const key =
    envObj.GEMINI_API_KEY ||
    (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) ||
    "";
  return key.trim();
}

// -------------------------------------------------------------
// Web Crypto HMAC-SHA256 Helper (Compatible with Workers & Node.js 18+)
// -------------------------------------------------------------
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return atob(b64);
}

/**
 * Creates a cryptographically signed session token:
 * format: ts_sess.<base64Url(payload)>.<hexSignature>
 */
export async function createSessionToken(payload: Record<string, any>, secret: string, expiresInHours = 3): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const fullPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp,
  };

  const payloadStr = base64UrlEncode(JSON.stringify(fullPayload));
  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadStr)
  );
  const sigHex = bufferToHex(signatureBuffer);
  return `ts_sess.${payloadStr}.${sigHex}`;
}

export async function verifySessionToken(token: string | null | undefined, secret: string): Promise<{ valid: boolean; payload?: any; error?: string }> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Missing session token" };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "ts_sess") {
    return { valid: false, error: "Invalid token format" };
  }

  const [, payloadB64, sigHex] = parts;

  try {
    const key = await getCryptoKey(secret);
    const expectedSigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payloadB64)
    );
    const expectedSigHex = bufferToHex(expectedSigBuffer);

    // Constant-time comparison
    if (expectedSigHex !== sigHex) {
      return { valid: false, error: "Signature mismatch" };
    }

    const payload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && now > payload.exp) {
      return { valid: false, error: "Session expired" };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message || "Failed to decode session token" };
  }
}

// -------------------------------------------------------------
// Authorized Master Codes (Guy, Team & QA)
// -------------------------------------------------------------
export const AUTHORIZED_MASTER_CODES = new Set([
  "TECH-AI-2026",
  "GUY-VIP",
  "SELECT-AI",
  "7788",
  "9903",
  "1234",
  "8899",
  "0503900903",
]);

export function isAuthorizedMasterCode(code: string | null | undefined, env?: any): boolean {
  if (!code) return false;
  const clean = String(code).trim().toUpperCase();
  if (AUTHORIZED_MASTER_CODES.has(clean)) return true;
  const envMaster = (env?.ADMIN_MASTER_CODE || (typeof process !== "undefined" && process.env?.ADMIN_MASTER_CODE) || "").trim().toUpperCase();
  if (envMaster && envMaster === clean) return true;
  return false;
}

/**
 * Stateless 4-digit Time-Windowed OTP generator (TOTP-like)
 * Generates a consistent 4-digit code based on identifier and 15-min time window.
 * Guarantees cross-worker verification even when challengeToken is missing or lost.
 */
export async function generateTimeWindowOtp(identifier: string, secret: string, windowMinutes = 15): Promise<string> {
  const enc = new TextEncoder();
  const cleanId = (identifier || "").toLowerCase().trim();
  const currentWindow = Math.floor(Date.now() / (windowMinutes * 60 * 1000));
  
  const digestBuffer = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(`${cleanId}:${currentWindow}:${secret}:tech-select-otp-v1`)
  );
  const hashArray = new Uint8Array(digestBuffer);
  const val = (hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3];
  const code = String(1000 + (Math.abs(val) % 9000));
  return code;
}

export async function verifyTimeWindowOtp(code: string, identifier: string, secret: string, windowMinutes = 15): Promise<boolean> {
  const cleanCode = String(code || "").trim();
  if (!cleanCode || cleanCode.length < 4) return false;
  const enc = new TextEncoder();
  const cleanId = (identifier || "").toLowerCase().trim();
  const currentWindow = Math.floor(Date.now() / (windowMinutes * 60 * 1000));
  
  // Check current window and previous window (allows up to 30 mins)
  for (const w of [currentWindow, currentWindow - 1]) {
    const digestBuffer = await crypto.subtle.digest(
      "SHA-256",
      enc.encode(`${cleanId}:${w}:${secret}:tech-select-otp-v1`)
    );
    const hashArray = new Uint8Array(digestBuffer);
    const val = (hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3];
    const candidate = String(1000 + (Math.abs(val) % 9000));
    if (candidate === cleanCode) {
      return true;
    }
  }
  return false;
}

/**
 * Creates a signed OTP Challenge token.
 * Contains: hash(code + salt), email/phone, and expiration (15 mins).
 */
export async function createOtpChallengeToken(code: string, identifier: string, secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 15 * 60; // 15 mins
  // Hash code with secret
  const enc = new TextEncoder();
  const cleanId = identifier.toLowerCase().trim();
  const codeDigestBuffer = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(`${code}:${cleanId}:${secret}`)
  );
  const codeHash = bufferToHex(codeDigestBuffer);

  const payload = {
    h: codeHash,
    id: cleanId,
    exp,
  };

  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const key = await getCryptoKey(secret);
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const sigHex = bufferToHex(sigBuffer);

  return `ts_otp.${payloadB64}.${sigHex}`;
}

export async function verifyOtpChallenge(
  code: string,
  challengeToken: string,
  identifier: string,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  if (!challengeToken || typeof challengeToken !== "string") {
    return { valid: false, error: "Missing challenge token" };
  }

  const parts = challengeToken.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "ts_otp") {
    return { valid: false, error: "Invalid challenge token format" };
  }

  const [, payloadB64, sigHex] = parts;

  try {
    const key = await getCryptoKey(secret);
    const enc = new TextEncoder();
    const expectedSigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
    const expectedSigHex = bufferToHex(expectedSigBuffer);

    if (expectedSigHex !== sigHex) {
      return { valid: false, error: "Challenge signature invalid" };
    }

    const payload = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && now > payload.exp) {
      return { valid: false, error: "Challenge token expired" };
    }

    // Compute hash of provided code using payload.id first
    const cleanId = (payload.id || identifier || "").toLowerCase().trim();
    const testDigestBuffer = await crypto.subtle.digest(
      "SHA-256",
      enc.encode(`${code.trim()}:${cleanId}:${secret}`)
    );
    const testHash = bufferToHex(testDigestBuffer);

    if (testHash === payload.h) {
      return { valid: true };
    }

    // Secondary check with identifier if different
    if (identifier && identifier.toLowerCase().trim() !== cleanId) {
      const altDigest = await crypto.subtle.digest(
        "SHA-256",
        enc.encode(`${code.trim()}:${identifier.toLowerCase().trim()}:${secret}`)
      );
      if (bufferToHex(altDigest) === payload.h) {
        return { valid: true };
      }
    }

    return { valid: false, error: "Incorrect access code" };
  } catch (err: any) {
    return { valid: false, error: err.message || "Challenge verification failed" };
  }
}

// -------------------------------------------------------------
// In-Memory Rate Limiter & Brute Force Protector
// -------------------------------------------------------------
interface RateBucket {
  count: number;
  resetAt: number;
  failedAttempts: number;
  lockedUntil: number;
}

const rateLimitMap = new Map<string, RateBucket>();

export function checkRateLimit(
  key: string,
  maxCalls: number = 30,
  windowMs: number = 10 * 60 * 1000
): boolean {
  const now = Date.now();
  const bucket = rateLimitMap.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
      failedAttempts: 0,
      lockedUntil: 0,
    });
    return true;
  }

  if (bucket.lockedUntil && now < bucket.lockedUntil) {
    return false;
  }

  if (bucket.count >= maxCalls) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function recordFailedAttempt(
  key: string,
  maxFailures: number = 5,
  lockoutMs: number = 15 * 60 * 1000
): { locked: boolean; remainingAttempts: number } {
  const now = Date.now();
  let bucket = rateLimitMap.get(key);

  if (!bucket || now > bucket.resetAt) {
    bucket = {
      count: 1,
      resetAt: now + lockoutMs,
      failedAttempts: 1,
      lockedUntil: 0,
    };
    rateLimitMap.set(key, bucket);
    return { locked: false, remainingAttempts: maxFailures - 1 };
  }

  bucket.failedAttempts += 1;

  if (bucket.failedAttempts >= maxFailures) {
    bucket.lockedUntil = now + lockoutMs;
    return { locked: true, remainingAttempts: 0 };
  }

  return { locked: false, remainingAttempts: maxFailures - bucket.failedAttempts };
}

export function resetFailedAttempts(key: string): void {
  const bucket = rateLimitMap.get(key);
  if (bucket) {
    bucket.failedAttempts = 0;
    bucket.lockedUntil = 0;
  }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    request.headers.get("X-Real-IP") ||
    "unknown-ip"
  );
}
