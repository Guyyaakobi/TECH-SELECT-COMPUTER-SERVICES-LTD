import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import { detectAndListCustomers, registerCustomCustomer } from "../../../services/graphHours";
import { getKnownTeamMembers, registerCustomEmployee } from "../../../services/sharepointLists";

export async function onRequestOptions(context?: any): Promise<Response> {
  const request: Request = context?.request || new Request("https://localhost");
  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(request, "GET, POST, OPTIONS"),
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Graph-Token",
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
    const forceRefresh = url.searchParams.get("refresh") === "true";
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";
    const userToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const graphUserToken = (request.headers.get("X-Graph-Token") || request.headers.get("x-graph-token") || "").trim();
    const requestEnv = { ...env, userToken, graphUserToken };

    const [customersDetection, employees] = await Promise.all([
      detectAndListCustomers(requestEnv, forceRefresh).catch(() => ({
        customers: [],
        totalCustomers: 0,
      })),
      Promise.resolve(getKnownTeamMembers()),
    ]);

    return new Response(
      JSON.stringify({
        customers: customersDetection.customers || [],
        totalCustomers: customersDetection.totalCustomers || 0,
        employees,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "שגיאה בטעינת רשימת לקוחות ועובדים" }),
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
    const body: any = await request.json().catch(() => ({}));
    const entityType = String(body.entityType || body.type || "").trim();
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";
    const userToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const graphUserToken = (request.headers.get("X-Graph-Token") || request.headers.get("x-graph-token") || "").trim();
    const requestEnv = { ...env, userToken, graphUserToken };

    if (entityType === "customer") {
      const result = await registerCustomCustomer(
        {
          name: body.name,
          englishName: body.englishName,
          aliases: body.aliases,
          createSharePointFolder: body.createSharePointFolder !== false,
        },
        requestEnv
      );
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (entityType === "employee") {
      const result = registerCustomEmployee({
        name: body.name,
        email: body.email,
        shortName: body.shortName,
        aliases: body.aliases,
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "סוג פעולה לא חוקי (נדרש customer או employee)" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[POST /api/hours/manage] Error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "שגיאה בהוספת לקוח / עובד" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
