import * as jose from "jose";
import { getCorsHeaders } from "../_shared/security";

export interface AuthenticatedUser {
  name: string;
  email: string;
  oid: string;
}

const jwksCache = new Map<string, ReturnType<typeof jose.createRemoteJWKSet>>();

function getTenantJWKS(tenantId: string) {
  let jwks = jwksCache.get(tenantId);
  if (!jwks) {
    const jwksUri = new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`);
    jwks = jose.createRemoteJWKSet(jwksUri, {
      cacheMaxAge: 3600000,
      cooldownDuration: 30000,
    });
    jwksCache.set(tenantId, jwks);
  }
  return jwks;
}

/**
 * Authenticate Microsoft 365 Entra ID token in Cloudflare Pages/Worker environment
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
  const tenantId = (
    env?.AZURE_TENANT_ID ||
    env?.TENANT_ID ||
    (typeof process !== "undefined" && (process.env.AZURE_TENANT_ID || process.env.TENANT_ID)) ||
    ""
  ).trim();

  const clientId = (
    env?.AZURE_CLIENT_ID ||
    env?.CLIENT_ID ||
    (typeof process !== "undefined" && (process.env.AZURE_CLIENT_ID || process.env.CLIENT_ID)) ||
    ""
  ).trim();

  if (!tenantId) {
    console.warn("[HOURS AUTH 401] reason: unconfigured TENANT_ID on server");
    return {
      errorResponse: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  try {
    const JWKS = getTenantJWKS(tenantId);
    const verified = await jose.jwtVerify(token, JWKS, {
      algorithms: ["RS256"],
    });
    const payload = verified.payload;

    // Check Issuer
    const allowedIssuers = [
      `https://login.microsoftonline.com/${tenantId}/v2.0`,
      `https://sts.windows.net/${tenantId}/`,
    ];
    if (!allowedIssuers.includes(String(payload.iss || "").trim())) {
      console.warn("[HOURS AUTH 401] reason: bad issuer", payload.iss);
      return {
        errorResponse: new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        ),
      };
    }

    // Check Audience
    if (clientId) {
      const allowedAudiences = [clientId, `api://${clientId}`, `api://${clientId}/access_as_user`];
      const aud = payload.aud;
      const isAudValid = Array.isArray(aud)
        ? aud.some((a) => allowedAudiences.includes(a))
        : allowedAudiences.includes(String(aud));
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

    // Check Tenant ID ("tid")
    if (payload.tid && String(payload.tid).trim() !== tenantId) {
      console.warn("[HOURS AUTH 401] reason: bad tid", payload.tid);
      return {
        errorResponse: new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        ),
      };
    }

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
      console.warn("[HOURS AUTH 401] reason: malformed token missing oid/sub");
      return {
        errorResponse: new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        ),
      };
    }

    return {
      user: { name, email, oid },
    };
  } catch (err: any) {
    console.warn("[HOURS AUTH 401] reason:", err?.message || "token validation failure");
    return {
      errorResponse: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }
}
