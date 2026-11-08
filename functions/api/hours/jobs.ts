import { authenticateHoursRequest } from "./_auth";
import { getCorsHeaders } from "../_shared/security";
import {
  getHoursJob,
  createHoursJob,
  executeJobSlice,
  cancelHoursJob,
  HoursJobType,
} from "../../../services/hoursJobQueue";

export async function onRequestOptions(context: any): Promise<Response> {
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

/**
 * GET /api/hours/jobs
 * - Retrieve status and progress of a queued job (?jobId=... or ?id=...)
 * - If ?step=true and job is pending/processing: executes the next controlled slice!
 */
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
  const jobId = url.searchParams.get("jobId") || url.searchParams.get("id");
  const shouldStep = url.searchParams.get("step") === "true";

  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "חסר פרמטר מזהה משימה: jobId" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let job = getHoursJob(jobId);
  if (!job) {
    return new Response(
      JSON.stringify({ error: `משימה ${jobId} לא נמצאה או שפג תוקפה` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // If client requested a step and job is still active, execute the next slice
  if (shouldStep && (job.status === "pending" || job.status === "processing")) {
    try {
      job = await executeJobSlice(jobId, env);
    } catch (stepErr: any) {
      console.error(`[api/hours/jobs] Error stepping job ${jobId}:`, stepErr);
    }
  }

  return new Response(
    JSON.stringify({
      id: job.id,
      type: job.type,
      status: job.status,
      totalUnits: job.totalUnits,
      processedUnits: job.processedUnits,
      progressPercent: job.progressPercent,
      currentSliceIndex: job.currentSliceIndex,
      totalSlices: job.totalSlices,
      stageDescription: job.stageDescription,
      results: job.results,
      errors: job.errors,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * POST /api/hours/jobs
 * - Explicitly enqueue a heavy job (batch_write_rows, deep_workbook_inspection, etc.)
 */
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

  const action = body.action || "create";

  // Action: Step existing job
  if (action === "step" || body.jobId) {
    const targetJobId = body.jobId;
    if (!targetJobId) {
      return new Response(
        JSON.stringify({ error: "חסר פרמטר jobId לביצוע צעד" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const updatedJob = await executeJobSlice(targetJobId, env);
      return new Response(JSON.stringify(updatedJob), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (stepErr: any) {
      return new Response(
        JSON.stringify({ error: stepErr?.message || "שגיאה בביצוע צעד במשימה" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Action: Cancel
  if (action === "cancel") {
    const targetJobId = body.jobId;
    const cancelled = cancelHoursJob(targetJobId, body.reason);
    if (!cancelled) {
      return new Response(
        JSON.stringify({ error: `משימה ${targetJobId} לא נמצאה` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify(cancelled), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Action: Create new job
  const type: HoursJobType = body.type || "batch_write_rows";
  const payload = body.payload;

  if (!payload) {
    return new Response(
      JSON.stringify({ error: "חסר תוכן משימה (payload)" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const job = createHoursJob({
      type,
      payload,
      userContext: auth.user,
      metadata: body.metadata,
    });

    // Execute first slice
    const steppedJob = await executeJobSlice(job.id, env);

    return new Response(
      JSON.stringify({
        queued: true,
        jobId: steppedJob.id,
        status: steppedJob.status,
        type: steppedJob.type,
        totalUnits: steppedJob.totalUnits,
        processedUnits: steppedJob.processedUnits,
        progressPercent: steppedJob.progressPercent,
        currentSliceIndex: steppedJob.currentSliceIndex,
        totalSlices: steppedJob.totalSlices,
        stageDescription: steppedJob.stageDescription,
        results: steppedJob.results,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[api/hours/jobs] Creation error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "שגיאה ביצירת משימה בתור" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
