import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import { findDuplicates } from "../../../services/graphHours";

export async function onRequestOptions(context: any): Promise<Response> {
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

export async function onRequestPost(context: any): Promise<Response> {
  const request: Request = context.request;
  const env: any = context.env || {};
  const corsHeaders = getCorsHeaders(request);

  // Auth gate
  const auth = await authenticateHoursRequest(request, env);
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "בקשה לא תקינה (Malformed JSON body)" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { fileId, employee, date, start, duration } = body;

  if (!fileId || !employee || !date) {
    return new Response(
      JSON.stringify({ error: "נדרשים שדות חובה: fileId, employee, date" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const result = await findDuplicates(fileId, { employee, date, start, duration }, env);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[api/hours/find-duplicates] Error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "שגיאה בבדיקת כפילויות שעות" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
