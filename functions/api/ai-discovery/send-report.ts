import { handleSendEmailReport, onRequestOptions } from "./send-email-report";

export { onRequestOptions };

export async function onRequestPost(context: any): Promise<Response> {
  const req = context?.request || context;
  const env = context?.env || {};
  return handleSendEmailReport(req, env, context);
}
