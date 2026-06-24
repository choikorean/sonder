import { getAuthContext } from "@/lib/auth";
import { buildReviewSummary } from "@/lib/copy-formats";
import { getHistory } from "@/lib/history";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const ctx = await getSubscriberContext(supabase);
  if (!ctx.capabilities.reviewSummary) {
    return errorResponse(
      "대표 검토용 정리는 Team 요금제에서 이용할 수 있습니다.",
      403,
    );
  }

  const history = await getHistory(supabase, {
    retentionDays: ctx.retentionDays,
  });
  const summary = buildReviewSummary(history);

  return successResponse({ summary });
}
