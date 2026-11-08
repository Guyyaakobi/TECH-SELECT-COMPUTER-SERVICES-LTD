import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";

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
  const env = context.env || {};
  const corsHeaders = getCorsHeaders(request);

  const auth = await authenticateHoursRequest(request, env);
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  return new Response(
    JSON.stringify(auth.user),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
