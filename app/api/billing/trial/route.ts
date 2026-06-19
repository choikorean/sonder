import { getAuthContext } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST() {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const { data, error } = await supabase.rpc("start_free_trial");
  if (error) {
    return errorResponse("무료 체험을 시작하지 못했습니다.", 500);
  }

  return successResponse({
    status: data?.status ?? "trialing",
    currentPeriodEnd: data?.current_period_end ?? null,
  });
}
