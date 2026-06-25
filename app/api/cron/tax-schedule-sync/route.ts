import { type NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/lib/api-response";
import { isAuthorizedCronSecret } from "@/lib/cron-auth";
import { syncTaxSchedule } from "@/lib/tax-schedule/sync";

function isAuthorizedCron(request: NextRequest): boolean {
  return isAuthorizedCronSecret(request, [
    "TAX_SCHEDULE_CRON_SECRET",
    "CRON_SECRET",
  ]);
}

async function handleSync(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return errorResponse("권한이 없습니다.", 401);
  }

  try {
    const result = await syncTaxSchedule();
    const status = result.success ? 200 : 500;
    return successResponse(result, status);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "세무일정 동기화에 실패했습니다.";
    return errorResponse(message, 500);
  }
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
