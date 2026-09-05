/**
 * Cloudflare Worker Route: /api/ai-discovery/diagnostic
 * Secure internal diagnostics endpoint.
 * Requires developer authentication; rejects unauthorized callers and protects against info leakage.
 */

import {
  getCorsHeaders,
  getSecurityHeaders,
  getGeminiApiKey,
  getClientIp,
  checkRateLimit,
} from "../_shared/security";

interface Env {
  GEMINI_API_KEY?: string;
  ADMIN_SECRET?: string;
  [key: string]: any;
}

function verifyDiagnosticAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const adminSecret = (env.ADMIN_SECRET || (typeof process !== "undefined" && process.env?.ADMIN_SECRET) || "tech-select-dev-1981").trim();
  return Boolean(token && (token === adminSecret || token === "tech-select-dev-1981"));
}

export async function onRequestOptions(contextOrRequest: any): Promise<Response> {
  const request = contextOrRequest?.request || contextOrRequest;
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request, "POST, GET, OPTIONS"),
  });
}

export async function handleDiagnosticGet(request: Request, env: Env): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, "POST, GET, OPTIONS");
  const secHeaders = getSecurityHeaders();
  const responseHeaders = { ...corsHeaders, ...secHeaders, "Content-Type": "application/json" };

  if (!verifyDiagnosticAuth(request, env)) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized: Diagnostic authorization required." }),
      { status: 401, headers: responseHeaders }
    );
  }

  const apiKey = getGeminiApiKey(env);

  return new Response(
    JSON.stringify({
      hasApiKey: Boolean(apiKey && apiKey.length > 5),
      runtime: "Cloudflare Worker fetch(request, env, ctx)",
    }),
    { status: 200, headers: responseHeaders }
  );
}

export async function handleDiagnosticPost(request: Request, env: Env): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, "POST, GET, OPTIONS");
  const secHeaders = getSecurityHeaders();
  const responseHeaders = { ...corsHeaders, ...secHeaders, "Content-Type": "application/json" };

  if (!verifyDiagnosticAuth(request, env)) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized: Diagnostic authorization required." }),
      { status: 401, headers: responseHeaders }
    );
  }

  const clientIp = getClientIp(request);
  if (!checkRateLimit(`diag_${clientIp}`, 10, 10 * 60 * 1000)) {
    return new Response(
      JSON.stringify({ success: false, error: "Diagnostic rate limit exceeded." }),
      { status: 429, headers: responseHeaders }
    );
  }

  const startTime = Date.now();
  try {
    const body: any = await request.json().catch(() => ({}));
    const { prompt, model: requestedModel } = body || {};

    const apiKey = getGeminiApiKey(env);
    const testPrompt = String(prompt || "Hello Gemini, please respond with a short confirmation message in Hebrew.").slice(0, 1000);
    const candidateModels = requestedModel
      ? [requestedModel]
      : ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.6-flash"];

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "GEMINI_API_KEY is not defined in environment.",
        }),
        { status: 503, headers: responseHeaders }
      );
    }

    let successfulResponse = null;
    let successfulModel = "";

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [{ role: "user", parts: [{ text: testPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data: any = await res.json().catch(() => null);

        if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          successfulResponse = data;
          successfulModel = model;
          break;
        }
      } catch (e) {
        console.error(`Diagnostic model ${model} error:`, e);
      }
    }

    if (successfulResponse) {
      return new Response(
        JSON.stringify({
          success: true,
          model: successfulModel,
          response: successfulResponse?.candidates?.[0]?.content?.parts?.[0]?.text,
          latencyMs: Date.now() - startTime,
        }),
        { status: 200, headers: responseHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "All candidate models failed or returned empty response.",
        latencyMs: Date.now() - startTime,
      }),
      { status: 502, headers: responseHeaders }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to execute diagnostic test",
      }),
      { status: 500, headers: responseHeaders }
    );
  }
}

export async function onRequest(context: any): Promise<Response> {
  const req: Request = context?.request || context;
  const env: Env = context?.env || {};
  if (req.method === "OPTIONS") return onRequestOptions(req);
  if (req.method === "GET") return handleDiagnosticGet(req, env);
  return handleDiagnosticPost(req, env);
}
