import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import { getUserListsDailySummary } from "../../../services/sharepointLists";

export async function onRequestOptions(context?: any): Promise<Response> {
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

export async function onRequestGet(context: { request: Request; env: any }): Promise<Response> {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request);

  const auth = await authenticateHoursRequest(request, env);
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";
    const userToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const requestEnv = { ...env, userToken };

    const url = new URL(request.url);
    const queryName = (url.searchParams.get("employeeName") || url.searchParams.get("employee") || "").trim();
    const queryEmail = (url.searchParams.get("employeeEmail") || url.searchParams.get("email") || "").trim();
    const employeeName = queryName || auth.user?.name || "";
    const employeeEmail = queryEmail || auth.user?.email || "";

    const summary = await getUserListsDailySummary(
      { employeeName, employeeEmail, top: 500 },
      requestEnv
    );

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    console.error("[GET /api/hours/my-lists-hours] Error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "שגיאה בשליפת נתוני התיעוד מ-Microsoft Lists" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
