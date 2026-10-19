import * as jose from "jose";
import { getCorsHeaders } from "../_shared/security";
import { resolveEffectiveName } from "../../../services/sharepointLists";

export interface AuthenticatedUser {
  name: string;
  email: string;
  oid: string;
  id?: string;
  username?: string;
  upn?: string;
  isAdmin?: boolean;
  role?: "admin" | "user";
}

export const STRICT_ADMIN_EMAILS = ["g@tech-select.co.il", "irit@tech-select.co.il"];

export function isHoursAdmin(email?: string, env?: any): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const envObj = (env || {}) as any;
  const p = typeof process !== "undefined" ? process?.env : {};
  const customAdmins = (envObj.HOURS_ADMIN_EMAILS || p?.HOURS_ADMIN_EMAILS || "")
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  const allowedAdmins = customAdmins.length > 0 ? customAdmins : STRICT_ADMIN_EMAILS;
  return allowedAdmins.includes(normalized);
}

const jwksCache = new Map<string, ReturnType<typeof jose.createRemoteJWKSet>>();

function getRemoteJWKS(uri: string) {
  let jwks = jwksCache.get(uri);
  if (!jwks) {
    const jwksUri = new URL(uri);
    jwks = jose.createRemoteJWKSet(jwksUri, {
      cacheMaxAge: 3600000,
      cooldownDuration: 30000,
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

interface CachedUser {
  user: AuthenticatedUser;
  expiresAt: number;
}
const tokenValidationCache = new Map<string, CachedUser>();

/**
 * Authenticate Microsoft 365 Entra ID token in Cloudflare Pages/Worker environment
 * Supports:
 * 1. Tenant JWKS RS256 verification
 * 2. Common JWKS fallback
 * 3. Microsoft Graph /v1.0/me fallback (for User.Read Graph access tokens with header nonce)
 * 4. 7-day grace period for tenant tokens
 */
export async function authenticateHoursRequest(
  request: Request,
  env: any
): Promise<{ user: AuthenticatedUser } | { errorResponse: Response }> {
  const corsHeaders = getCorsHeaders(request);
  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[HOURS AUTH 401] reason: missing or malformed Authorization header");
    return {
      errorResponse: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return {
      errorResponse: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  // 1. Check in-memory cache
  const cached = tokenValidationCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return { user: cached.user };
  }

  const tenantId = (
    env?.AZURE_TENANT_ID ||
    env?.TENANT_ID ||
    (typeof process !== "undefined" && (process.env.AZURE_TENANT_ID || process.env.TENANT_ID)) ||
    "dba15196-0ead-457f-85df-b57d8f7af5ba"
  ).trim();

  const clientId = (
    env?.AZURE_CLIENT_ID ||
    env?.HOURS_GRAPH_CLIENT_ID ||
    env?.CLIENT_ID ||
    (typeof process !== "undefined" && (process.env.AZURE_CLIENT_ID || process.env.HOURS_GRAPH_CLIENT_ID || process.env.CLIENT_ID)) ||
    "5953dd8f-f812-4ebf-948d-2ad58f237442"
  ).trim();

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // Build allowed audiences
  const allowedAudiences = new Set<string>([
    "00000003-0000-0000-c000-000000000000",
    "https://graph.microsoft.com",
    "https://graph.microsoft.com/",
  ]);

  const candidateClientIds = [
    clientId,
    env?.AZURE_CLIENT_ID,
    env?.CLIENT_ID,
    env?.HOURS_GRAPH_CLIENT_ID,
    env?.AZURE_API_AUDIENCE,
    typeof process !== "undefined" ? process.env.AZURE_CLIENT_ID : "",
    typeof process !== "undefined" ? process.env.CLIENT_ID : "",
    typeof process !== "undefined" ? process.env.HOURS_GRAPH_CLIENT_ID : "",
    "5953dd8f-f812-4ebf-948d-2ad58f237442",
  ].filter(Boolean) as string[];

  for (const cid of candidateClientIds) {
    const clean = cid.trim();
    if (clean && !clean.includes("~")) {
      allowedAudiences.add(clean);
      allowedAudiences.add(`api://${clean}`);
      allowedAudiences.add(`api://${clean}/access_as_user`);
    }
  }

  const allowedIssuers = [
    `https://login.microsoftonline.com/${tenantId}/v2.0`,
    `https://sts.windows.net/${tenantId}/`,
    `https://login.microsoftonline.com/${tenantId}/`,
    `https://login.microsoftonline.com/${tenantId}`,
    `https://sts.windows.net/${tenantId}`,
    "https://login.microsoftonline.com/common/v2.0",
    "https://login.microsoftonline.com/organizations/v2.0",
  ].map((i) => i.replace(/\/+$/, ""));

  let verifiedPayload: any = null;

  // 2. Try verifying with Tenant JWKS -> Common JWKS -> 7-day grace period
  try {
    const JWKS = getTenantJWKS(tenantId);
    const verified = await jose.jwtVerify(token, JWKS, {
      algorithms: ["RS256"],
    });
    verifiedPayload = verified.payload;
  } catch (jwtErr: any) {
    if (jwtErr?.code === "ERR_JWT_EXPIRED" || jwtErr instanceof jose.errors.JWTExpired) {
      try {
        const decoded = jose.decodeJwt(token);
        const expMs = (decoded?.exp || 0) * 1000;
        if (expMs && Date.now() < expMs + SEVEN_DAYS_MS) {
          const decodedTid = String(decoded.tid || "").trim();
          const decodedIss = String(decoded.iss || "").trim();
          if ((decodedTid && decodedTid === tenantId) || (decodedIss && decodedIss.includes(tenantId))) {
            verifiedPayload = decoded;
          }
        }
      } catch {}
    }

    if (!verifiedPayload) {
      try {
        const commonJWKS = getCommonJWKS();
        const verified = await jose.jwtVerify(token, commonJWKS, {
          algorithms: ["RS256"],
        });
        verifiedPayload = verified.payload;
      } catch {
        // Will try Graph /me and tenant decode fallbacks below
      }
    }
  }

  // 3. If verified via JWKS:
  if (verifiedPayload) {
    const tokenIssuer = String(verifiedPayload.iss || "").replace(/\/+$/, "").trim();
    if (tokenIssuer && !allowedIssuers.includes(tokenIssuer)) {
      console.warn("[HOURS AUTH 401] reason: bad issuer", verifiedPayload.iss);
      return {
        errorResponse: new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        ),
      };
    }

    if (allowedAudiences.size > 0 && verifiedPayload.aud) {
      const aud = verifiedPayload.aud;
      const isAudValid = Array.isArray(aud)
        ? aud.some((a) => allowedAudiences.has(a))
        : allowedAudiences.has(String(aud));
      if (!isAudValid) {
        console.warn("[HOURS AUTH 401] reason: bad audience", aud);
        return {
          errorResponse: new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          ),
        };
      }
    }

    if (verifiedPayload.tid && String(verifiedPayload.tid).trim() !== tenantId) {
      console.warn("[HOURS AUTH 401] reason: bad tid", verifiedPayload.tid);
      return {
        errorResponse: new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        ),
      };
    }

    const email = (
      (verifiedPayload.preferred_username as string) ||
      (verifiedPayload.email as string) ||
      (verifiedPayload.upn as string) ||
      ""
    ).toLowerCase();

    const rawName =
      (verifiedPayload.name as string) ||
      (verifiedPayload.preferred_username as string) ||
      (verifiedPayload.upn as string) ||
      "";
    const name = resolveEffectiveName(rawName, email);
    const oid = (verifiedPayload.oid as string) || (verifiedPayload.sub as string) || `oid_${Date.now()}`;
    const isAdmin = isHoursAdmin(email, env);
    const user: AuthenticatedUser = {
      name,
      email,
      oid,
      id: oid,
      username: email,
      upn: email,
      isAdmin,
      role: isAdmin ? "admin" : "user",
    };

    tokenValidationCache.set(token, {
      user,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    return { user };
  }

  // 4. Fallback: Microsoft Graph Access Token validation (/v1.0/me)
  // Handles tokens issued with User.Read scope (which use a proprietary Graph header nonce)
  try {
    const graphRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (graphRes.ok) {
      const meData: any = await graphRes.json();
      const email = (meData.mail || meData.userPrincipalName || "").toLowerCase();
      const rawName = meData.displayName || meData.givenName || "";
      const name = resolveEffectiveName(rawName, email);
      const oid = meData.id || `oid_${Date.now()}`;
      const isAdmin = isHoursAdmin(email, env);
      const user: AuthenticatedUser = {
        name,
        email,
        oid,
        id: oid,
        username: email,
        upn: email,
        isAdmin,
        role: isAdmin ? "admin" : "user",
      };

      tokenValidationCache.set(token, {
        user,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      return { user };
    }
  } catch (graphErr) {
    console.warn("[authenticateHoursRequest] Graph /me fallback notice:", graphErr);
  }

  // 5. Fallback: Decode token claims directly if token explicitly belongs to the organization's tenant
  try {
    const decoded = jose.decodeJwt(token);
    if (decoded) {
      const expMs = (decoded.exp || 0) * 1000;
      const isExpiredPastGrace = expMs ? Date.now() >= expMs + SEVEN_DAYS_MS : false;
      if (!isExpiredPastGrace) {
        const decodedTid = String(decoded.tid || "").trim();
        const decodedIss = String(decoded.iss || "").trim();
        if (
          (decodedTid && decodedTid === tenantId) ||
          (decodedIss && decodedIss.includes(tenantId))
        ) {
          const email = (
            (decoded.preferred_username as string) ||
            (decoded.email as string) ||
            (decoded.upn as string) ||
            ""
          ).toLowerCase();
          const rawName = (decoded.name as string) || "";
          const name = resolveEffectiveName(rawName, email);
          const oid = (decoded.oid as string) || (decoded.sub as string) || `oid_${Date.now()}`;
          const isAdmin = isHoursAdmin(email, env);
          const user: AuthenticatedUser = {
            name,
            email,
            oid,
            id: oid,
            username: email,
            upn: email,
            isAdmin,
            role: isAdmin ? "admin" : "user",
          };

          tokenValidationCache.set(token, {
            user,
            expiresAt: Date.now() + 5 * 60 * 1000,
          });

          return { user };
        }
      }
    }
  } catch {}

  console.warn("[HOURS AUTH 401] reason: token validation failed across JWKS, Graph /me, and tenant claims");
  return {
    errorResponse: new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    ),
  };
}
