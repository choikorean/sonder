import { type NextRequest } from "next/server";

import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthContext } from "@/lib/auth";
import {
  FollowUpAccessError,
  updateFollowUpTask,
} from "@/lib/follow-up/service";
import { getSubscriberContext } from "@/lib/subscriber-context";
import {
  firstZodErrorMessage,
  followUpTaskUpdateSchema,
} from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = followUpTaskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  if (!parsed.data.status && parsed.data.assignedUserId === undefined) {
    return errorResponse("변경할 항목을 입력해 주세요.", 400);
  }

  try {
    const ctx = await getSubscriberContext(supabase);
    const task = await updateFollowUpTask(supabase, {
      ctx,
      userId: user.id,
      taskId: id,
      status: parsed.data.status,
      assignedUserId: parsed.data.assignedUserId,
    });

    return successResponse({ task });
  } catch (error) {
    if (error instanceof FollowUpAccessError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("후속 조치 업데이트에 실패했습니다.", 500);
  }
}
