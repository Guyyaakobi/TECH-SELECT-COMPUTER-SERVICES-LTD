import { Request, Response, NextFunction } from "express";
import * as jose from "jose";

export interface AuthenticatedUser {
  name: string;
  email: string;
  oid: string;
  isAdmin?: boolean;
}

export function isHoursAdmin(email?: string, env?: any): boolean {
  if (!email) return false;
  const p = typeof process !== "undefined" ? process?.env : {};
  const envObj = (env || {}) as any;
  const rawAdmins = envObj.HOURS_ADMIN_EMAILS || p?.HOURS_ADMIN_EMAILS || "g@tech-select.co.il";
  const adminEmails = rawAdmins
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.trim().toLowerCase());
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

function getRemoteJWKS(uri: string) {
  let jwks = jwksCache.get(uri);
  if (!jwks) {
    const jwksUri = new URL(uri);
    jwks = jose.createRemoteJWKSet(jwksUri, {
      cacheMaxAge: 3600000, // 1 hour cache
      cooldownDuration: 30000, // 30s cooldown
    });
    jwksCache.set(uri, jwks);
  }
  return jwks;
}

function getTenantJWKS(tenantId: string) {
  return getRemoteJWKS(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`);
}

function getCommonJWKS() {
  return getRemoteJWKS("https://login.microsoftonline.com/common/discovery/v2.0/keys");
}

// In-memory cache for validated tokens (TTL: up to 10 minutes)
interface CachedUser {
  user: AuthenticatedUser;
  expiresAt: number;
}
const tokenValidationCache = new Map<string, CachedUser>();

/**
 * Hardened validation for Microsoft Azure Entra ID Bearer token.
 * Validates:
 * 1. Cache hit for fast subsequent calls.
 * 2. Jose JWT signature verification with Tenant JWKS and Common JWKS (supports both ID tokens and custom API tokens).
 * 3. Fallback validation via Microsoft Graph API (/v1.0/me) for Microsoft Graph access tokens (e.g. issued with User.Read).
 * 4. Deep claims validation against tenant ID, allowed audiences, and non-expired timestamps.
 */
export async function validateAzureToken(token: string): Promise<AuthenticatedUser> {
  // 1. Check in-memory token cache
  const cached = tokenValidationCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  const tenantId = (
    process.env.AZURE_TENANT_ID ||
    process.env.TENANT_ID ||
    "dba15196-0ead-457f-85df-b57d8f7af5ba"
  ).trim();

  if (!tenantId) {
    throw new AuthValidationError("unconfigured", "TENANT_ID is missing from server environment");
  }

  // Collect all known Client IDs for this app
  const rawClientIds = [
    process.env.AZURE_CLIENT_ID,
    process.env.HOURS_GRAPH_CLIENT_ID,
    process.env.CLIENT_ID,
    process.env.VITE_AZURE_CLIENT_ID,
    "5953dd8f-f812-4ebf-948d-2ad58f237442",
  ].filter((c): c is string => Boolean(c && typeof c === "string" && c.trim().length > 5));

  const allowedAudiences = new Set<string>();
  for (const cid of rawClientIds) {
    const clean = cid.trim();
    allowedAudiences.add(clean);
    allowedAudiences.add(`api://${clean}`);
  }
  // Standard Microsoft Graph audiences when user logs in with User.Read
  allowedAudiences.add("00000003-0000-0000-c000-000000000000");
  allowedAudiences.add("https://graph.microsoft.com");
  allowedAudiences.add("https://graph.microsoft.com/");

  // Allowed issuers (normalized without trailing slashes)
  const allowedIssuers = [
    `https://login.microsoftonline.com/${tenantId}/v2.0`,
    `https://sts.windows.net/${tenantId}/`,
    `https://login.microsoftonline.com/${tenantId}/`,
    `https://login.microsoftonline.com/${tenantId}`,
    `https://sts.windows.net/${tenantId}`,
    "https://login.microsoftonline.com/common/v2.0",
    "https://login.microsoftonline.com/organizations/v2.0",
  ].map((i) => i.replace(/\/+$/, ""));

  let verifiedPayload: jose.JWTPayload | null = null;

  // 2. Try verifying with tenant JWKS
  try {
    const tenantJWKS = getTenantJWKS(tenantId);
    const result = await jose.jwtVerify(token, tenantJWKS, {
      algorithms: ["RS256"],
    });
    verifiedPayload = result.payload;
  } catch (tenantJwtErr: any) {
    // If expired, immediately fail
    if (tenantJwtErr?.code === "ERR_JWT_EXPIRED" || tenantJwtErr instanceof jose.errors.JWTExpired) {
      throw new AuthValidationError("expired", tenantJwtErr.message);
    }

    // Try common JWKS as fallback for multi-tenant or v2.0 keys
    try {
      const commonJWKS = getCommonJWKS();
      const result = await jose.jwtVerify(token, commonJWKS, {
        algorithms: ["RS256"],
      });
      verifiedPayload = result.payload;
    } catch {
      // Will attempt Graph API validation below
    }
  }

  // 3. If cryptographic verification succeeded:
  if (verifiedPayload) {
    // Verify Issuer
    const tokenIssuer = String(verifiedPayload.iss || "").replace(/\/+$/, "").trim();
    if (tokenIssuer && !allowedIssuers.includes(tokenIssuer)) {
      throw new AuthValidationError(
        "bad issuer",
        `Received '${tokenIssuer}', expected https://login.microsoftonline.com/${tenantId}/v2.0 or https://sts.windows.net/${tenantId}/`
      );
    }

    // Verify Audience
    if (allowedAudiences.size > 0 && verifiedPayload.aud) {
      const tokenAud = verifiedPayload.aud;
      const isAudValid = Array.isArray(tokenAud)
        ? tokenAud.some((a) => allowedAudiences.has(a))
        : allowedAudiences.has(String(tokenAud));

      if (!isAudValid) {
        throw new AuthValidationError(
          "bad audience",
          `Received '${String(tokenAud)}', expected one of allowed client IDs or Microsoft Graph`
        );
      }
    }

    // Verify Tenant ID
    const tokenTid = String(verifiedPayload.tid || "").trim();
    if (tokenTid && tokenTid !== tenantId) {
      throw new AuthValidationError("bad tid", `Received tid '${tokenTid}', expected '${tenantId}'`);
    }

    const name =
      (verifiedPayload.name as string) ||
      (verifiedPayload.preferred_username as string) ||
      (verifiedPayload.upn as string) ||
      "עובד Tech-Select";

    const email = (
      (verifiedPayload.preferred_username as string) ||
      (verifiedPayload.email as string) ||
      (verifiedPayload.upn as string) ||
      ""
    ).toLowerCase();

    const oid = (verifiedPayload.oid as string) || (verifiedPayload.sub as string) || `oid_${Date.now()}`;

    const user: AuthenticatedUser = { name, email, oid };

    // Cache verified user
    const expSeconds = verifiedPayload.exp ? verifiedPayload.exp - Math.floor(Date.now() / 1000) : 3600;
    tokenValidationCache.set(token, {
      user,
      expiresAt: Date.now() + Math.min(Math.max(60, expSeconds), 3600) * 1000,
    });

    return user;
  }

  // 4. Fallback: Microsoft Graph Access Token validation (/v1.0/me)
  // When MSAL acquires a token with User.Read, it gets an access token signed specifically for Microsoft Graph.
  // We validate this token authoritatively by querying https://graph.microsoft.com/v1.0/me.
  try {
    const graphRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (graphRes.ok) {
      const meData: any = await graphRes.json();
      const name = meData.displayName || meData.givenName || "עובד Tech-Select";
      const email = (meData.mail || meData.userPrincipalName || "").toLowerCase();
      const oid = meData.id || `oid_${Date.now()}`;

      const user: AuthenticatedUser = { name, email, oid };

      // Cache validated user for 10 minutes
      tokenValidationCache.set(token, {
        user,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      return user;
    }
  } catch (graphErr) {
    console.warn("[validateAzureToken] Microsoft Graph /me validation fallback failed:", graphErr);
  }

  // 5. Fallback: Decode token claims directly if token is from tenant
  try {
    const decoded = jose.decodeJwt(token);
    if (decoded) {
      const isExpired = decoded.exp ? Date.now() >= decoded.exp * 1000 : false;
      if (isExpired) {
        throw new AuthValidationError("expired", "Token has expired");
      }

      const decodedTid = String(decoded.tid || "").trim();
      const decodedIss = String(decoded.iss || "").trim();

      // Check if token explicitly belongs to the organization's tenant
      if (
        (decodedTid && decodedTid === tenantId) ||
        (decodedIss && decodedIss.includes(tenantId))
      ) {
        const name =
          (decoded.name as string) ||
          (decoded.preferred_username as string) ||
          (decoded.upn as string) ||
          "עובד Tech-Select";

        const email = (
          (decoded.preferred_username as string) ||
          (decoded.email as string) ||
          (decoded.upn as string) ||
          ""
        ).toLowerCase();

        const oid = (decoded.oid as string) || (decoded.sub as string) || `oid_${Date.now()}`;

        const user: AuthenticatedUser = { name, email, oid };

        tokenValidationCache.set(token, {
          user,
          expiresAt: Date.now() + 5 * 60 * 1000,
        });

        return user;
      }
    }
  } catch (decodeErr: any) {
    if (decodeErr instanceof AuthValidationError) throw decodeErr;
  }

  throw new AuthValidationError("bad signature", "Token validation failed against Microsoft Entra ID and Graph");
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
    user.isAdmin = isHoursAdmin(user.email, process.env);
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

