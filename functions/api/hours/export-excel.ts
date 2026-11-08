import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import {
  fetchSharePointListEntries,
  resolveUserAccessScope,
  canUserViewEmployee,
} from "../../../services/sharepointLists";
import * as XLSX from "xlsx";

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
    const date = (url.searchParams.get("date") || "").trim() || undefined;
    const period = (url.searchParams.get("period") || "").trim() || undefined;
    const customer = (url.searchParams.get("customer") || "").trim() || undefined;
    const employee = (url.searchParams.get("employee") || "").trim() || undefined;
    const query = (url.searchParams.get("query") || url.searchParams.get("q") || "").trim() || undefined;

    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization") || "";
    const userToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    const requestEnv = { ...env, userToken };

    const [rawEntries, accessScope] = await Promise.all([
      fetchSharePointListEntries(requestEnv, {
        date: period === "day" || !period ? date : undefined,
        customer,
        employee,
        query,
        top: 500,
      }),
      resolveUserAccessScope({ name: auth.user?.name, email: auth.user?.email }, requestEnv),
    ]);

    const entries = rawEntries.filter((e) =>
      canUserViewEmployee(accessScope, e.employeeName, e.employeeEmail)
    );

    const rowsForExcel = entries.map((e, idx) => ({
      "#": idx + 1,
      "תאריך": e.date,
      "לקוח": e.customerName,
      "סוג פעילות": e.workType,
      "עובד": e.employeeName,
      "משתמש SSO": e.employeeEmail,
      "שעת התחלה": e.startTime,
      "שעת סיום": e.endTime,
      "שעות שהושקעו": e.durationHours,
      "תיאור הפעילות": e.description,
      "קישור ב-Lists": e.webUrl || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rowsForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "דיווח שעות - Lists");

    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 45 },
      { wch: 40 },
    ];

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const fileName = `TechSelect_Lists_Report_${date || new Date().toISOString().split("T")[0]}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/hours/export-excel] Error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "שגיאה בייצוא לקובץ Excel" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
