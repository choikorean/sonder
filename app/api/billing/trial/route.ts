import { requireBillingManager } from "@/lib/billing/access";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST() {
  const auth = await requireBillingManager();
  if (!auth.ok) return auth.response;
  const { supabase } = auth;

  const { data, error } = await supabase.rpc("start_free_trial");
  if (error) {
    return errorResponse("무료 체험을 시작하지 못했습니다.", 500);
  }

  return successResponse({
    status: data?.status ?? "trialing",
    currentPeriodEnd: data?.current_period_end ?? null,
  });
}
