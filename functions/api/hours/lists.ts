import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import {
  inspectSharePointListStatus,
  writeEntryToSharePointList,
} from "../../../services/sharepointLists";

export async function onRequestOptions(context?: any): Promise<Response> {
  const request: Request = context?.request || new Request("https://localhost");
  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(request, "GET, POST, OPTIONS"),
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    const result = await inspectSharePointListStatus(env);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to inspect Microsoft Lists" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request);

  const auth = await authenticateHoursRequest(request, env);
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const testResult = await writeEntryToSharePointList(
      {
        customerName: body.customerName || "בדיקת מערכת טק-סלקט",
        date: new Date().toISOString().split("T")[0],
        durationHours: Number(body.durationHours || 1),
        description: body.description || "בדיקת אינטגרציה וסנכרון מול Microsoft Lists",
        employeeName: auth.user?.name || "גיא יעקובי",
        employeeEmail: auth.user?.email || "g@tech-select.co.il",
        workType: body.workType || "קריאות שירות",
      },
      env
    );

    return new Response(JSON.stringify(testResult), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to write to Microsoft Lists" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
