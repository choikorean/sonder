import { type NextRequest } from "next/server";

import { errorResponse } from "@/lib/api-response";

/** 빌키 발급은 auth-callback에서 server-side로 처리됩니다. */
export async function POST(_request: NextRequest) {
  return errorResponse(
    "빌키 발급은 /api/billing/auth-callback 경로에서 처리됩니다.",
    400,
  );
}
