// @ts-nocheck
import { handleSendEmailReport, onRequestOptions } from "./send-email-report";

export { onRequestOptions };

export async function onRequestPost(context: any) {
  return handleSendEmailReport(context.request, context.env, context);
}
