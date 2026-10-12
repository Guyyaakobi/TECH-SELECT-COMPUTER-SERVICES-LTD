import { getCorsHeaders } from "../_shared/security";

interface Env {
  TENANT_ID?: string;
  AZURE_TENANT_ID?: string;
  CLIENT_ID?: string;
  AZURE_CLIENT_ID?: string;
  AZURE_API_AUDIENCE?: string;
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

  // Read from Cloudflare env bindings, with process.env only as a fallback for local dev
  const envAny = env as any;
  const tenantId = (
    envAny.AZURE_TENANT_ID ||
    envAny.TENANT_ID ||
    (typeof process !== "undefined" && (process.env.AZURE_TENANT_ID || process.env.TENANT_ID)) ||
    ""
  ).trim();

  const clientId = (
    envAny.AZURE_CLIENT_ID ||
    envAny.HOURS_GRAPH_CLIENT_ID ||
    envAny.CLIENT_ID ||
    envAny.GRAPH_CLIENT_ID ||
    (typeof process !== "undefined" && (process.env.AZURE_CLIENT_ID || (process.env as any).HOURS_GRAPH_CLIENT_ID || process.env.CLIENT_ID || (process.env as any).GRAPH_CLIENT_ID)) ||
    ""
  ).trim();

  // apiScope must be "api://" + AZURE_CLIENT_ID + "/access_as_user"
  const apiScope = clientId ? `api://${clientId}/access_as_user` : "";

  // Never return any client secret
  return new Response(
    JSON.stringify({
      tenantId,
      clientId,
      apiScope,
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
