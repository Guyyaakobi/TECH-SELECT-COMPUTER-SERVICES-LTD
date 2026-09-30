import { Request, Response, NextFunction } from "express";
import * as jose from "jose";

export interface AuthenticatedUser {
  name: string;
  email: string;
  oid: string;
}

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export type AuthFailureReason =
  | "bad audience"
  | "bad issuer"
  | "bad signature"
  | "bad tid"
  | "expired"
  | "malformed token"
  | "unconfigured";

export class AuthValidationError extends Error {
  public reason: AuthFailureReason;
  constructor(reason: AuthFailureReason, detail?: string) {
    super(detail ? `${reason}: ${detail}` : reason);
    this.reason = reason;
  }
}

// In-memory cache for remote JWKS to avoid re-fetching on every request
const jwksCache = new Map<string, ReturnType<typeof jose.createRemoteJWKSet>>();

function getTenantJWKS(tenantId: string) {
  let jwks = jwksCache.get(tenantId);
  if (!jwks) {
    const jwksUri = new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`);
    jwks = jose.createRemoteJWKSet(jwksUri, {
      cacheMaxAge: 3600000, // 1 hour cache
      cooldownDuration: 30000, // 30s cooldown
    });
    jwksCache.set(tenantId, jwks);
  }
  return jwks;
}

/**
 * Hardened validation for Microsoft Azure Entra ID Bearer token against tenant JWKS.
 * Checks:
 * - Signature: verified against tenant JWKS (discovery/v2.0/keys)
 * - Issuer: strictly https://login.microsoftonline.com/{AZURE_TENANT_ID}/v2.0 OR https://sts.windows.net/{AZURE_TENANT_ID}/
 * - Audience: strictly AZURE_CLIENT_ID OR "api://" + AZURE_CLIENT_ID
 * - Expiry: not expired
 * - Tenant ID ("tid" claim): strictly equals AZURE_TENANT_ID
 */
export async function validateAzureToken(token: string): Promise<AuthenticatedUser> {
  const tenantId = (process.env.AZURE_TENANT_ID || process.env.TENANT_ID || "").trim();
  const clientId = (process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID || "").trim();

  if (!tenantId) {
    throw new AuthValidationError("unconfigured", "TENANT_ID is missing from server environment");
  }

  // 1. Setup JWKS for the single tenant
  const JWKS = getTenantJWKS(tenantId);

  // 2. Strict allowed single-tenant issuers
  const allowedIssuers = [
    `https://login.microsoftonline.com/${tenantId}/v2.0`,
    `https://sts.windows.net/${tenantId}/`,
  ];

  // 3. Strict allowed audiences: AZURE_CLIENT_ID OR "api://" + AZURE_CLIENT_ID
  const allowedAudiences: string[] = [];
  if (clientId) {
    allowedAudiences.push(clientId);
    allowedAudiences.push(`api://${clientId}`);
  }

  // 4. Verify signature, header, and expiry via jose
  let payload: jose.JWTPayload;
  try {
    const verified = await jose.jwtVerify(token, JWKS, {
      algorithms: ["RS256"],
    });
    payload = verified.payload;
  } catch (jwtErr: any) {
    if (jwtErr?.code === "ERR_JWT_EXPIRED" || jwtErr instanceof jose.errors.JWTExpired) {
      throw new AuthValidationError("expired", jwtErr.message);
    }
    if (
      jwtErr?.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED" ||
      jwtErr instanceof jose.errors.JWSSignatureVerificationFailed ||
      jwtErr?.message?.includes("signature") ||
      jwtErr?.message?.includes("key")
    ) {
      throw new AuthValidationError("bad signature", jwtErr.message);
    }
    throw new AuthValidationError("malformed token", jwtErr?.message || "Invalid JWT structure");
  }

  // 5. Strict Issuer Verification
  const tokenIssuer = String(payload.iss || "").trim();
  if (!allowedIssuers.includes(tokenIssuer)) {
    throw new AuthValidationError(
      "bad issuer",
      `Received '${tokenIssuer}', expected https://login.microsoftonline.com/${tenantId}/v2.0 or https://sts.windows.net/${tenantId}/`
    );
  }

  // 6. Strict Audience Verification: AZURE_CLIENT_ID OR "api://" + AZURE_CLIENT_ID
  if (allowedAudiences.length > 0) {
    const tokenAud = payload.aud;
    const isAudValid = Array.isArray(tokenAud)
      ? tokenAud.some((a) => allowedAudiences.includes(a))
      : allowedAudiences.includes(String(tokenAud));

    if (!isAudValid) {
      throw new AuthValidationError(
        "bad audience",
        `Received '${String(tokenAud)}', expected ${allowedAudiences.join(" or ")}`
      );
    }
  }

  // 7. Strict Tenant ID ("tid" claim) verification
  const tokenTid = String(payload.tid || "").trim();
  if (tokenTid !== tenantId) {
    throw new AuthValidationError(
      "bad tid",
      `Received tid '${tokenTid}', expected '${tenantId}'`
    );
  }

  // 8. Extract user identity strictly from validated token claims
  const name =
    (payload.name as string) ||
    (payload.preferred_username as string) ||
    (payload.upn as string) ||
    "עובד מערכת";

  const email = (
    (payload.preferred_username as string) ||
    (payload.email as string) ||
    (payload.upn as string) ||
    ""
  ).toLowerCase();

  const oid = (payload.oid as string) || (payload.sub as string) || "";

  if (!oid) {
    throw new AuthValidationError("malformed token", "Token claims missing required user identifier (oid / sub)");
  }

  return {
    name,
    email,
    oid,
  };
}

/**
 * Express Authentication Middleware for all /api/hours endpoints.
 * Requires: Authorization: Bearer <token>
 * Sets: req.user = { name, email, oid }
 * On 401: Logs the exact reason server-side (bad audience / issuer / expired / signature / bad tid),
 *         never exposing it to the client.
 */
export async function hoursAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== "string") {
      console.warn("[HOURS AUTH 401] reason: missing Authorization header");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match || !match[1]) {
      console.warn("[HOURS AUTH 401] reason: malformed Authorization header format");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const token = match[1].trim();
    if (!token) {
      console.warn("[HOURS AUTH 401] reason: empty Bearer token");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Verify token with hardened rules
    const user = await validateAzureToken(token);

    // Expose validated user on req.user
    req.user = user;
    next();
  } catch (err: any) {
    // Log the exact reason server-side (bad audience / issuer / expired / signature / bad tid)
    const exactReason = err?.message || "unknown token verification failure";
    console.warn(`[HOURS AUTH 401] reason: ${exactReason}`);

    // NEVER expose the exact reason to the client
    res.status(401).json({
      error: "Unauthorized",
    });
  }
}
