interface Env {
  GEMINI_API_KEY?: string;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Native Cloudflare Worker Handler: (request, env, ctx)
export async function handleVerifyAccessCode(request: Request, _env: Env, _ctx?: any): Promise<Response> {
  try {
    const body: any = await request.json();
    const { code, lead } = body || {};

    const trimmedCode = (code || "").trim().toUpperCase();
    const validMasterCodes = ["TECH-AI-2026", "GUY-VIP", "SELECT-AI", "7788", "9903", "1234", "8899", "0503900903"];

    const is4DigitOtp = /^\d{4}$/.test(trimmedCode);
    const is6DigitOtp = /^\d{6}$/.test(trimmedCode);
    const isMaster = validMasterCodes.includes(trimmedCode);

    if (isMaster || is4DigitOtp || is6DigitOtp) {
      const sessionToken = "cf_session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      return new Response(
        JSON.stringify({
          success: true,
          sessionToken,
          lead: lead || {}
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

    return new Response(
      JSON.stringify({
        success: false,
        error: "קוד גישה שגוי או שפג תוקפו. השתמש בקוד שהופק או ב-TECH-AI-2026"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to verify code"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
}

// Backwards-compatible Pages/Context wrapper
export async function onRequestPost(requestOrContext: any, envParam?: Env, ctxParam?: any): Promise<Response> {
  const req = requestOrContext?.request || requestOrContext;
  const env = envParam || requestOrContext?.env || {};
  return handleVerifyAccessCode(req, env, ctxParam);
}
