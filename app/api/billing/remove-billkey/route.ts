import { getAuthContext } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { removeUserBillkey } from "@/lib/billing/subscription-service";

export async function POST() {
  const { user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  try {
    const result = await removeUserBillkey(user.id);
    return successResponse(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "빌키 삭제에 실패했습니다.";
    return errorResponse(message, 500);
  }
}
