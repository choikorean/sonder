import { type NextRequest } from "next/server";
import { ZodError } from "zod";

import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthContext } from "@/lib/auth";
import {
  getTaxScheduleEventsForMonth,
  getTaxScheduleSyncMeta,
} from "@/lib/tax-schedule/queries";
import { getKstYearMonth } from "@/lib/tax-schedule/window";
import {
  firstZodErrorMessage,
  taxScheduleQuerySchema,
} from "@/lib/validators";

export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const raw = {
    year:
      request.nextUrl.searchParams.get("year") ??
      String(getKstYearMonth().year),
    month:
      request.nextUrl.searchParams.get("month") ??
      String(getKstYearMonth().month),
    taxCategory: request.nextUrl.searchParams.get("taxCategory") ?? undefined,
  };

  let parsed;
  try {
    parsed = taxScheduleQuerySchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(firstZodErrorMessage(error), 400);
    }
    throw error;
  }

  try {
    const [events, syncMeta] = await Promise.all([
      getTaxScheduleEventsForMonth(
        supabase,
        parsed.year,
        parsed.month,
        parsed.taxCategory,
      ),
      getTaxScheduleSyncMeta(supabase),
    ]);

    return successResponse({
      year: parsed.year,
      month: parsed.month,
      taxCategory: parsed.taxCategory ?? null,
      events,
      syncMeta,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "세무일정을 불러오지 못했습니다.";
    return errorResponse(message, 500);
  }
}
