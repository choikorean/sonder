import { requireBillingManager } from "@/lib/billing/access";
import { successResponse, errorResponse } from "@/lib/api-response";
import { removeUserBillkey } from "@/lib/billing/subscription-service";

export async function POST() {
  const auth = await requireBillingManager();
  if (!auth.ok) return auth.response;
  const { user } = auth;

  try {
    const result = await removeUserBillkey(user.id);
    return successResponse(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "빌키 삭제에 실패했습니다.";
    return errorResponse(message, 500);
  }
}
