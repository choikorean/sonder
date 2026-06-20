import { getAuthContext } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, amount, goods_name, status, auth_code, auth_date, paid_at, created_at, result_msg",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return errorResponse("결제내역 조회에 실패했습니다.", 500);
  }

  return successResponse({ payments: data ?? [] });
}
