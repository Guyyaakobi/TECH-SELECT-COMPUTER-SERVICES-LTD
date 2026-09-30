import * as jose from "jose";
import { getCorsHeaders } from "../_shared/security";

interface Env {
  TENANT_ID?: string;
  AZURE_TENANT_ID?: string;
  CLIENT_ID?: string;
  AZURE_CLIENT_ID?: string;
}

export async function onRequestOptions(context: any): Promise<Response> {
  const request: Request = context?.request || new Request("https://localhost");
  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(request, "GET, OPTIONS"),
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function onRequestGet(context: any): Promise<Response> {
  const request: Request = context.request;
  const env: Env = context.env || {};
  const corsHeaders = getCorsHeaders(request);

  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[HOURS AUTH 401] reason: missing or malformed Authorization header");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const tenantId = (env.AZURE_TENANT_ID || env.TENANT_ID || "").trim();
  const clientId = (env.AZURE_CLIENT_ID || env.CLIENT_ID || "").trim();

  if (!tenantId) {
    console.warn("[HOURS AUTH 401] reason: unconfigured TENANT_ID on server");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const JWKS = jose.createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`)
    );

    // Strict allowed issuers
    const allowedIssuers = [
      `https://login.microsoftonline.com/${tenantId}/v2.0`,
      `https://sts.windows.net/${tenantId}/`,
    ];

    // Strict allowed audiences: AZURE_CLIENT_ID OR "api://" + AZURE_CLIENT_ID
    const allowedAudiences: string[] = [];
    if (clientId) {
      allowedAudiences.push(clientId);
      allowedAudiences.push(`api://${clientId}`);
    }

    let payload: jose.JWTPayload;
    try {
      const verified = await jose.jwtVerify(token, JWKS, {
        algorithms: ["RS256"],
      });
      payload = verified.payload;
    } catch (jwtErr: any) {
      if (jwtErr?.code === "ERR_JWT_EXPIRED" || jwtErr instanceof jose.errors.JWTExpired) {
        console.warn(`[HOURS AUTH 401] reason: expired (${jwtErr.message})`);
      } else {
        console.warn(`[HOURS AUTH 401] reason: bad signature (${jwtErr?.message})`);
      }
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify issuer
    const tokenIssuer = String(payload.iss || "").trim();
    if (!allowedIssuers.includes(tokenIssuer)) {
      console.warn(`[HOURS AUTH 401] reason: bad issuer (received '${tokenIssuer}', expected https://login.microsoftonline.com/${tenantId}/v2.0 or https://sts.windows.net/${tenantId}/)`);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify audience
    if (allowedAudiences.length > 0) {
      const tokenAud = payload.aud;
      const isAudValid = Array.isArray(tokenAud)
        ? tokenAud.some((a) => allowedAudiences.includes(a))
        : allowedAudiences.includes(String(tokenAud));

      if (!isAudValid) {
        console.warn(`[HOURS AUTH 401] reason: bad audience (received '${String(tokenAud)}', expected ${allowedAudiences.join(" or ")})`);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Verify tid claim
    const tokenTid = String(payload.tid || "").trim();
    if (tokenTid !== tenantId) {
      console.warn(`[HOURS AUTH 401] reason: bad tid (received '${tokenTid}', expected '${tenantId}')`);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    return new Response(
      JSON.stringify({ name, email, oid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.warn(`[HOURS AUTH 401] reason: ${err?.message || "Token verification failed"}`);
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
