import { type NextRequest } from "next/server";

import { requireBillingManager } from "@/lib/billing/access";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  billingCancelSchema,
  firstZodErrorMessage,
} from "@/lib/validators";
import { cancelSubscriptionAtPeriodEnd } from "@/lib/billing/subscription-service";

export async function POST(request: NextRequest) {
  const auth = await requireBillingManager();
  if (!auth.ok) return auth.response;
  const { user } = auth;

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = billingCancelSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  try {
    const data = await cancelSubscriptionAtPeriodEnd({
      userId: user.id,
      reason: parsed.data.reason,
    });

    return successResponse({
      cancelAtPeriodEnd: true,
      currentPeriodEnd: data.current_period_end,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "구독 해지에 실패했습니다.";
    return errorResponse(message, 500);
  }
}
