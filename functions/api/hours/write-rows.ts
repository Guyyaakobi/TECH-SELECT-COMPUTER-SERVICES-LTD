import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import { writeRows } from "../../../services/graphHours";
import {
  evaluateHoursRequestComplexity,
  createHoursJob,
  executeJobSlice,
} from "../../../services/hoursJobQueue";

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

  const fileId = body.fileId;
  const rows = body.rows;

  if (!fileId || !rows || !Array.isArray(rows) || rows.length === 0) {
    return new Response(
      JSON.stringify({ error: "נדרשים שדות חובה: fileId ומערך שורות rows" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 1. Evaluate complexity: Single task recording MUST stay immediate & synchronous!
  const complexity = evaluateHoursRequestComplexity("write-rows", {
    rows,
    forceQueue: body.forceQueue,
  });

  // FAST PATH: Regular single task write (Immediate & Synchronous)
  if (!complexity.isHeavy) {
    try {
      const result = await writeRows(
        fileId,
        rows,
        auth.user,
        env,
        body.driveId,
        body.workType
      );
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("[api/hours/write-rows] Error (Fast Path):", err);
      return new Response(
        JSON.stringify({ error: err?.message || "שגיאה בכתיבת שורות לקובץ ה-Excel" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // HEAVY PATH: Multiple rows / complex batch write transferred to Job Queue
  try {
    const job = createHoursJob({
      type: "batch_write_rows",
      payload: {
        fileId,
        rows,
        driveId: body.driveId,
        workType: body.workType,
      },
      userContext: auth.user,
      metadata: {
        reason: complexity.reason,
        clientIp: request.headers.get("CF-Connecting-IP") || "local",
      },
    });

    // Automatically execute the first controlled slice (2 rows, ~5-7 subrequests)
    const updatedJob = await executeJobSlice(job.id, env);

    return new Response(
      JSON.stringify({
        queued: true,
        jobId: updatedJob.id,
        status: updatedJob.status,
        type: updatedJob.type,
        totalUnits: updatedJob.totalUnits,
        processedUnits: updatedJob.processedUnits,
        progressPercent: updatedJob.progressPercent,
        currentSliceIndex: updatedJob.currentSliceIndex,
        totalSlices: updatedJob.totalSlices,
        stageDescription: updatedJob.stageDescription,
        results: updatedJob.results,
        message: "פעולה מרובת שורות הועברה לתור מנות מבוקר (Job Queue) למניעת חריגת תעבורה",
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (queueErr: any) {
    console.error("[api/hours/write-rows] Queue Error:", queueErr);
    return new Response(
      JSON.stringify({ error: queueErr?.message || "שגיאה באתחול תור משימות" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
