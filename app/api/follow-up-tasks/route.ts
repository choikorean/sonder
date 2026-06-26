import { type NextRequest } from "next/server";
import { ZodError } from "zod";

import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthContext } from "@/lib/auth";
import { listFollowUpTasks } from "@/lib/follow-up/service";
import { getSubscriberContext } from "@/lib/subscriber-context";
import {
  firstZodErrorMessage,
  followUpTaskListQuerySchema,
} from "@/lib/validators";

export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const raw = {
    status: request.nextUrl.searchParams.get("status") ?? "pending",
  };

  let parsed;
  try {
    parsed = followUpTaskListQuerySchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(firstZodErrorMessage(error), 400);
    }
    throw error;
  }

  try {
    const ctx = await getSubscriberContext(supabase);
    const tasks = await listFollowUpTasks(supabase, {
      ctx,
      userId: user.id,
      status: parsed.status,
    });

    return successResponse({ tasks });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "후속 조치 목록을 불러오지 못했습니다.";
    return errorResponse(message, 500);
  }
}
