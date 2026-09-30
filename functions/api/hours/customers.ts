import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import { listCustomers, findCustomer } from "../../../services/graphHours";

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
  const env: any = context.env || {};
  const corsHeaders = getCorsHeaders(request);

  // Auth gate
  const auth = await authenticateHoursRequest(request, env);
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || url.searchParams.get("query") || url.searchParams.get("search");
  const forceRefresh = url.searchParams.get("refresh") === "true";

  try {
    if (query !== null && query !== undefined && query.trim() !== "") {
      const results = await findCustomer(query, env);
      return new Response(JSON.stringify({ query, results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customers = await listCustomers(env, forceRefresh);
    return new Response(JSON.stringify({ customers }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[api/hours/customers] Error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "שגיאה בגישה ל-SharePoint" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
