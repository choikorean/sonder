import { type NextRequest } from "next/server";

import { requireBillingManager } from "@/lib/billing/access";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  billingPrepareSchema,
  firstZodErrorMessage,
} from "@/lib/validators";
import { prepareNicepayCheckout } from "@/lib/billing/prepare";

export async function POST(request: NextRequest) {
  const auth = await requireBillingManager();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = billingPrepareSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  const { planId, cycle, checkoutType } = parsed.data;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

    const result = await prepareNicepayCheckout({
      supabase,
      userId: user.id,
      userEmail: user.email ?? "",
      userName: profile?.name,
      userPhone: profile?.phone,
      planId,
      cycle,
      checkoutType,
      appUrl,
    });

    return successResponse(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "결제 준비에 실패했습니다.";
    return errorResponse(message, 500);
  }
}
