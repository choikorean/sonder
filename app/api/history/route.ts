import { getAuthContext } from "@/lib/auth";
import { getHistory } from "@/lib/history";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const ctx = await getSubscriberContext(supabase);
  const data = await getHistory(supabase, {
    retentionDays: ctx.retentionDays,
  });
  return successResponse({
    ...data,
    retentionDays: ctx.retentionDays,
    capabilities: {
      reviewSummary: ctx.capabilities.reviewSummary,
      copyFormats: ctx.capabilities.copyFormats,
      fullConsultationOutput: ctx.capabilities.fullConsultationOutput,
    },
  });
}
