import { createServiceClient } from "@/lib/supabase/service";
import { acceptOrganizationInvite } from "@/lib/org";
import { getAuthContext } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { orgInviteAcceptSchema, firstZodErrorMessage } from "@/lib/validators";

export async function POST(request: Request) {
  const { user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = orgInviteAcceptSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  try {
    const service = createServiceClient();
    const result = await acceptOrganizationInvite(service, {
      token: parsed.data.token,
      userId: user.id,
    });
    return successResponse(result);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "초대 수락에 실패했습니다.",
      400,
    );
  }
}
