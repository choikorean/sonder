import { getAuthContext } from "@/lib/auth";
import { getHistory } from "@/lib/history";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const data = await getHistory(supabase);
  return successResponse(data);
}
