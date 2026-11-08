import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import { detectAndListCustomers, registerCustomCustomer } from "../../../services/graphHours";
import {
  getKnownTeamMembers,
  registerCustomEmployee,
  getTeamHierarchy,
  saveTeamManagerAssignment,
  isSuperAdminUser,
  doesEmployeeMatchQuery,
} from "../../../services/sharepointLists";

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
    const mode = (url.searchParams.get("mode") || "").trim();
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";
    const userToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const graphUserToken = (request.headers.get("X-Graph-Token") || request.headers.get("x-graph-token") || "").trim();
    const requestEnv = { ...env, userToken, graphUserToken };
    const isSuperAdmin = isSuperAdminUser(auth.user?.email, auth.user?.name);

    if (mode === "hierarchy") {
      const [allTeamManagers, employees] = await Promise.all([
        getTeamHierarchy(requestEnv, forceRefresh).catch(() => []),
        Promise.resolve(getKnownTeamMembers()),
      ]);
      // Non-super-admins only receive their own team manager assignment (if any)
      const visibleManagers = isSuperAdmin
        ? allTeamManagers
        : allTeamManagers.filter(
            (m) =>
              (auth.user?.email && m.managerEmail.toLowerCase() === auth.user.email.toLowerCase()) ||
              (auth.user?.name && doesEmployeeMatchQuery(m.managerName, m.managerEmail, auth.user.name))
          );
      return new Response(
        JSON.stringify({
          teamManagers: visibleManagers,
          employees: isSuperAdmin ? employees : [],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({
          error: "גישה לניהול לקוחות, עובדים ומנהלי צוות מורשית למנהלי המערכת (גיא ואירית) בלבד.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [customersDetection, employees, teamManagers] = await Promise.all([
      detectAndListCustomers(requestEnv, forceRefresh).catch(() => ({
        customers: [],
        totalCustomers: 0,
      })),
      Promise.resolve(getKnownTeamMembers()),
      getTeamHierarchy(requestEnv, forceRefresh).catch(() => []),
    ]);

    return new Response(
      JSON.stringify({
        customers: customersDetection.customers || [],
        totalCustomers: customersDetection.totalCustomers || 0,
        employees,
        teamManagers,
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

  if (!isSuperAdminUser(auth.user?.email, auth.user?.name)) {
    return new Response(
      JSON.stringify({
        error: "רק מנהלי מערכת (גיא ואירית) מורשים להוסיף לקוחות, עובדים או להגדיר מנהלי צוות.",
      }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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

    if (entityType === "team_manager") {
      const teamManagers = await saveTeamManagerAssignment(
        {
          managerEmail: body.managerEmail,
          managerName: body.managerName,
          employees: body.employees,
          remove: Boolean(body.remove),
        },
        requestEnv
      );
      return new Response(
        JSON.stringify({
          success: true,
          teamManagers,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "סוג פעולה לא חוקי (נדרש customer, employee או team_manager)" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[POST /api/hours/manage] Error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "שגיאה בהוספת לקוח / עובד / מנהל צוות" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

