import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import {
  listCustomerProjects,
  createCustomerProject,
} from "../../../services/customerProjects";

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
    const customerName = (url.searchParams.get("customerName") || url.searchParams.get("customer") || "").trim();
    const fileId = (url.searchParams.get("fileId") || "").trim() || undefined;
    const driveId = (url.searchParams.get("driveId") || "").trim() || undefined;
    const forceRefresh = url.searchParams.get("refresh") === "true";

    if (!customerName) {
      return new Response(JSON.stringify({ customerName: "", projects: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";
    const userToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const graphUserToken = (request.headers.get("X-Graph-Token") || request.headers.get("x-graph-token") || "").trim();
    const requestEnv = { ...env, userToken, graphUserToken };

    const result = await listCustomerProjects(
      { customerName, fileId, driveId, forceRefresh },
      requestEnv
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[GET /api/hours/projects] Error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "שגיאה בטעינת רשימת פרויקטים" }),
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
    const customerName = String(body.customerName || body.customer || "").trim();
    const projectName = String(body.projectName || body.name || "").trim();
    const confirmNewProject = body.confirmNewProject === true;

    if (!confirmNewProject) {
      return new Response(
        JSON.stringify({
          requiresConfirmation: true,
          error: `האם אתה בטוח שאתה רוצה לפתוח פרויקט חדש בשם "${projectName}" עבור ${customerName}?`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";
    const userToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const graphUserToken = (request.headers.get("X-Graph-Token") || request.headers.get("x-graph-token") || "").trim();
    const requestEnv = { ...env, userToken, graphUserToken };

    const result = await createCustomerProject(
      {
        customerName,
        projectName,
        confirmNewProject,
        createdBy: auth.user?.name,
        createdByEmail: auth.user?.email,
      },
      requestEnv
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[POST /api/hours/projects] Error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "שגיאה בפתיחת פרויקט חדש" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
