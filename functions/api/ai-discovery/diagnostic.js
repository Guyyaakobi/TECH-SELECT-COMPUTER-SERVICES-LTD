/**
 * Cloudflare Worker Route: /api/ai-discovery/diagnostic
 * Direct endpoint for Gemini AI connectivity testing & diagnostics.
 */

// Native Cloudflare Worker Handler: (request, env, ctx)
export async function handleDiagnostic(request, env, ctx) {
  if (request.method === "OPTIONS") {
    return onRequestOptions();
  }
  if (request.method === "GET") {
    return handleDiagnosticGet(request, env, ctx);
  }
  return handleDiagnosticPost(request, env, ctx);
}

// Backwards-compatible Pages/Context wrapper
export async function onRequest(contextOrRequest, env, ctx) {
  if (contextOrRequest && contextOrRequest.request) {
    return handleDiagnostic(contextOrRequest.request, contextOrRequest.env || env, contextOrRequest);
  }
  return handleDiagnostic(contextOrRequest, env, ctx);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function handleDiagnosticGet(request, env) {
  const envObj = env || {};

  const apiKey =
    envObj.GEMINI_API_KEY ||
    envObj.GOOGLE_GENAI_API_KEY ||
    envObj.GEMINI_KEY ||
    envObj.GOOGLE_API_KEY ||
    (typeof process !== "undefined" && process?.env?.GEMINI_API_KEY) ||
    (typeof globalThis !== "undefined" && globalThis?.GEMINI_API_KEY);

  const envKeys = Object.keys(envObj || {}).filter(k => k !== "ASSETS");

  return new Response(
    JSON.stringify({
      hasApiKey: Boolean(apiKey && apiKey.length > 5),
      keyLength: apiKey ? apiKey.length : 0,
      envKeys: envKeys,
      runtime: "Cloudflare Worker fetch(request, env, ctx)"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}

export async function onRequestGet(contextOrRequest, env, ctx) {
  if (contextOrRequest && contextOrRequest.request) {
    return handleDiagnosticGet(contextOrRequest.request, contextOrRequest.env || env);
  }
  return handleDiagnosticGet(contextOrRequest, env);
}

export async function handleDiagnosticPost(request, env) {
  const startTime = Date.now();
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const { prompt, model: requestedModel, customApiKey, systemInstruction } = body || {};

    // Retrieve API key directly from Worker env parameter
    const envObj = env || {};
    const apiKey =
      customApiKey ||
      envObj.GEMINI_API_KEY ||
      envObj.GOOGLE_GENAI_API_KEY ||
      envObj.GEMINI_KEY ||
      envObj.GOOGLE_API_KEY ||
      (typeof process !== "undefined" && process?.env?.GEMINI_API_KEY) ||
      (typeof globalThis !== "undefined" && globalThis?.GEMINI_API_KEY);

    const testPrompt = prompt || "Hello Gemini, please respond with a short confirmation message in Hebrew.";
    const candidateModels = requestedModel 
      ? [requestedModel]
      : ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.6-flash"];

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "GEMINI_API_KEY is not defined in Cloudflare Worker environment variables/secrets.",
          hint: "Please set GEMINI_API_KEY in Cloudflare Dashboard -> Workers -> techselectwebsite -> Settings -> Variables and Secrets or run: npx wrangler secret put GEMINI_API_KEY",
          runtime: "Cloudflare Worker fetch(request, env, ctx)",
          latencyMs: Date.now() - startTime
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    const attempts = [];
    let successfulResponse = null;
    let successfulModel = "";

    for (const model of candidateModels) {
      const modelStart = Date.now();
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
          contents: [{ role: "user", parts: [{ text: testPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        };

        if (systemInstruction) {
          payload.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const status = res.status;
        const data = await res.json().catch(() => null);
        const duration = Date.now() - modelStart;

        attempts.push({
          model,
          status,
          durationMs: duration,
          error: !res.ok ? data?.error || data : null
        });

        if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          successfulResponse = data;
          successfulModel = model;
          break;
        }
      } catch (err) {
        attempts.push({
          model,
          status: 0,
          durationMs: Date.now() - modelStart,
          error: err.message || String(err)
        });
      }
    }

    if (successfulResponse) {
      const candidate = successfulResponse.candidates[0];
      const replyText = candidate.content.parts[0].text;
      return new Response(
        JSON.stringify({
          success: true,
          endpoint: "/api/ai-discovery/diagnostic",
          environment: "Cloudflare Pages Functions",
          modelUsed: successfulModel,
          promptSent: testPrompt,
          reply: replyText,
          usageMetadata: successfulResponse.usageMetadata,
          totalLatencyMs: Date.now() - startTime,
          attempts
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          endpoint: "/api/ai-discovery/diagnostic",
          environment: "Cloudflare Pages Functions",
          error: attempts.length > 0 && attempts[0].error ? attempts[0].error : "All candidate models returned an error from Google API",
          totalLatencyMs: Date.now() - startTime,
          attempts
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        endpoint: "/api/ai-discovery/diagnostic",
        environment: "Cloudflare Pages Functions",
        error: error.message || "Unknown error during diagnostic execution",
        totalLatencyMs: Date.now() - startTime
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
}
