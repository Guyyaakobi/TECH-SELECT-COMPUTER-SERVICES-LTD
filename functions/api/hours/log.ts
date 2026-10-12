import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import {
  queryCentralLog,
  deleteOrCancelCentralLogEntry,
  uploadCentralLogFileToSharePoint,
  loadCentralLog,
} from "../../../services/hoursCentralLog";
import * as XLSX from "xlsx";

export async function onRequestOptions(context?: any): Promise<Response> {
  const request: Request = context?.request || new Request("https://localhost");
  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(request, "GET, POST, DELETE, OPTIONS"),
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function onRequest(context: { request: Request; env: any }): Promise<Response> {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request);
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return onRequestOptions(context);
  }

  const auth = await authenticateHoursRequest(request, env);
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  const user = auth.user;
  const isGuy = user.email?.toLowerCase() === "g@tech-select.co.il";
  if (!isGuy) {
    return new Response(
      JSON.stringify({ error: "גישה ליומן המרכזי מורשית אך ורק עבור g@tech-select.co.il" }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const pathname = url.pathname.replace(/\/$/, "");

  // 1. POST /api/hours/log/sync-sharepoint
  if (request.method === "POST" && pathname.endsWith("/sync-sharepoint")) {
    try {
      const result = await uploadCentralLogFileToSharePoint(env);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("[POST /api/hours/log/sync-sharepoint] Error:", err);
      return new Response(
        JSON.stringify({
          error: err?.message || "שגיאה בסנכרון קובץ LOG ל-SharePoint Tools",
          details: String(err),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // 2. GET /api/hours/log/export
  if (request.method === "GET" && pathname.endsWith("/export")) {
    try {
      const currentEntries = loadCentralLog();
      const excelRows = currentEntries.map((e) => ({
        "תאריך": e.date,
        "שם לקוח": e.customerName,
        "עובד": e.employeeName,
        "סוג": e.workType,
        "משעה": e.startTime || "",
        "עד שעה": e.endTime || "",
        "סיכום שעות": e.durationHours,
        "מה בוצע": e.description,
        "סטטוס": e.status,
        "מזהה תיעוד": e.id,
        "תאריך רישום": e.createdAt,
      }));

      const ws = XLSX.utils.json_to_sheet(excelRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "LOG");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new Response(buffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="TOOLS_LOG.xlsx"',
        },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || "שגיאה בייצוא" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // 3. DELETE /api/hours/log/:id
  if (request.method === "DELETE") {
    const parts = pathname.split("/");
    const id = parts[parts.length - 1];
    if (id && id !== "log") {
      const res = await deleteOrCancelCentralLogEntry(id, env);
      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // 4. GET /api/hours/log
  if (request.method === "GET") {
    try {
      const date = url.searchParams.get("date") || undefined;
      const employee = url.searchParams.get("employee") || undefined;
      const customer = url.searchParams.get("customer") || undefined;
      const q = url.searchParams.get("q") || undefined;
      const includeCancelled = url.searchParams.get("includeCancelled") === "true";

      const entries = queryCentralLog({
        date,
        employee,
        customer,
        query: q,
        includeCancelled,
      });

      return new Response(
        JSON.stringify({
          count: entries.length,
          entries,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || "שגיאה בשליפת יומן" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Not Found", { status: 404 });
}
