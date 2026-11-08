import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import { findMonthTarget, inspectWorkbookFile, chooseTargetWorksheet } from "../../../services/graphHours";

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
  const customer = url.searchParams.get("customer") || url.searchParams.get("customerId") || "";
  const date = url.searchParams.get("date") || url.searchParams.get("month") || "";
  const workType = url.searchParams.get("workType") || "";
  const shouldInspect = url.searchParams.get("inspect") === "true" || Boolean(workType);

  if (!customer) {
    return new Response(
      JSON.stringify({ error: "חסר פרמטר חובה: customer" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const result: any = await findMonthTarget(customer, date, env);
    if (shouldInspect && result.found && result.fileId) {
      try {
        const inspection = await Promise.race([
          inspectWorkbookFile(result.fileId, env, result.driveId, result.customerName || customer, {
            preferredTabName: workType,
            quickMode: true,
          }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 6500)),
        ]);
        if (inspection && inspection.worksheets.length > 0) {
          const choice = chooseTargetWorksheet(inspection, {
            preferredTabName: workType,
            entryDescription: "",
          });
          const chosenTab = choice.selectedTab;
          const offset = chosenTab.headerRowIndex !== undefined ? chosenTab.headerRowIndex + 2 : 2;
          result.targetTabName = chosenTab.name;
          result.detectedTabType = chosenTab.detectedType;
          result.availableTabs = choice.availableTabs;
          result.targetRow = chosenTab.totalDataRows + offset;
          result.headers = chosenTab.headers;
        }
      } catch {
        // ignore inspection warning
      }
    }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[api/hours/month-target] Error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "שגיאה באיתור קובץ שעות חודשי" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
