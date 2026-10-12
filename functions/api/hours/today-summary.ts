import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import { getDailyHoursReport } from "../../../services/graphHours";

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
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || undefined;
    const period = (url.searchParams.get("period") as any) || undefined;
    const customer = url.searchParams.get("customer") || undefined;
    const employee = url.searchParams.get("employee") || undefined;
    const report = await getDailyHoursReport(
      { date, period, customer, employee },
      env
    );

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    console.error("[GET /api/hours/today-summary] Error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to load hours report" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
