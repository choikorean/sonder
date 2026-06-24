import { createServiceClient } from "@/lib/supabase/service";
import { getInvitePreview } from "@/lib/org";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return errorResponse("초대 토큰이 필요합니다.", 400);
  }

  const service = createServiceClient();
  const preview = await getInvitePreview(service, token);
  if (!preview) {
    return errorResponse("유효하지 않거나 만료된 초대 링크입니다.", 404);
  }

  return successResponse(preview);
}
