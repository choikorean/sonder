import { type NextRequest } from "next/server";
import { ZodError } from "zod";

import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthContext } from "@/lib/auth";
import { getTaxScheduleEventsInRange } from "@/lib/tax-schedule/queries";
import { suggestPaymentDueDate } from "@/lib/tax-schedule/due-date-suggest";
import { addKstDays, getKstIsoDate } from "@/lib/tax-schedule/window";
import {
  dueDateSuggestQuerySchema,
  firstZodErrorMessage,
} from "@/lib/validators";

export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const raw = {
    taxType: request.nextUrl.searchParams.get("taxType") ?? undefined,
  };

  let parsed;
  try {
    parsed = dueDateSuggestQuerySchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(firstZodErrorMessage(error), 400);
    }
    throw error;
  }

  try {
    const startDate = getKstIsoDate();
    const endDate = addKstDays(120);
    const events = await getTaxScheduleEventsInRange(
      supabase,
      startDate,
      endDate,
      100,
    );

    const suggestion = suggestPaymentDueDate(events, parsed.taxType, startDate);

    return successResponse({
      suggestion,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "납부기한 제안을 불러오지 못했습니다.";
    return errorResponse(message, 500);
  }
}
