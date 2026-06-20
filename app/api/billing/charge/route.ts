import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  chargeSubscription,
  getActiveBillingKey,
} from "@/lib/billing/subscription-service";
import { createServiceClient } from "@/lib/supabase/service";
import { getPlan, planPrice, type BillingCycle } from "@/lib/plans";
import type { PaidPlanId } from "@/lib/billing/helpers";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.BILLING_CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (isCron) {
    const { chargeDueSubscriptions } = await import(
      "@/lib/billing/subscription-service"
    );
    try {
      const results = await chargeDueSubscriptions();
      return successResponse({ processed: results.length, results });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "정기 결제 처리에 실패했습니다.";
      return errorResponse(message, 500);
    }
  }

  const { user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  try {
    const supabase = createServiceClient();
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, plan, billing_cycle, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!subscription) {
      return errorResponse("활성 구독이 없습니다.", 400);
    }

    const billingKey = await getActiveBillingKey(supabase, user.id);
    if (!billingKey) {
      return errorResponse("등록된 결제수단이 없습니다.", 400);
    }

    const planId = subscription.plan as PaidPlanId;
    const cycle = subscription.billing_cycle as BillingCycle;
    const amount = planPrice(getPlan(planId), cycle);

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone, email")
      .eq("id", user.id)
      .maybeSingle();

    const result = await chargeSubscription({
      userId: user.id,
      subscriptionId: subscription.id,
      planId,
      cycle,
      amount,
      bid: billingKey.nicepay_bid,
      buyerEmail: profile?.email ?? user.email ?? undefined,
      buyerName: profile?.name ?? undefined,
      buyerTel: profile?.phone ?? undefined,
    });

    if (!result.success) {
      return errorResponse(
        result.result.ResultMsg || "결제에 실패했습니다.",
        402,
      );
    }

    return successResponse({
      paymentId: result.paymentId,
      authCode: result.result.AuthCode,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "결제 처리에 실패했습니다.";
    return errorResponse(message, 500);
  }
}
