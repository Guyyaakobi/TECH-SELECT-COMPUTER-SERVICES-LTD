import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import { processAssistantChat } from "../../../services/geminiHoursAssistant";

export async function onRequestOptions(context?: any): Promise<Response> {
  const request: Request = context?.request || new Request("https://localhost");
  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(request, "POST, OPTIONS"),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request);

  const auth = await authenticateHoursRequest(request, env);
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }
  const authUser = auth.user;

  try {
    const body: any = await request.json().catch(() => ({}));
    const result = await processAssistantChat(
      {
        user: authUser,
        message: body.message,
        audio: body.audio,
        history: body.history,
        action: body.action,
        cardId: body.cardId,
        draftData: body.draftData,
        activeDrafts: body.activeDrafts,
        undoData: body.undoData,
        writtenEntries: body.writtenEntries,
        env,
      },
      env
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    console.error("[POST /api/hours/assistant] Error:", err);
    return new Response(
      JSON.stringify({
        error: err?.message || "Internal server error in assistant processing",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

