import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { checkoutSchema, firstZodErrorMessage } from "@/lib/validators";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getPlan, planPrice } from "@/lib/plans";
import { getBillingProvider } from "@/lib/billing";

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  const { planId, cycle } = parsed.data;
  const plan = getPlan(planId);
  if (!plan.purchasable) {
    return errorResponse("결제할 수 없는 요금제입니다.", 400);
  }

  const amount = planPrice(plan, cycle);
  const provider = getBillingProvider();

  const { data: order, error: orderError } = await supabase
    .from("payment_orders")
    .insert({
      user_id: user.id,
      plan: planId,
      billing_cycle: cycle,
      amount,
      status: "pending",
      provider: provider.id,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return errorResponse("주문 생성에 실패했습니다.", 500);
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  const result = await provider.createCheckout({
    orderId: order.id,
    userId: user.id,
    planId,
    cycle,
    amount,
    appUrl,
  });

  if (result.kind === "redirect") {
    return successResponse({ orderId: order.id, redirectUrl: result.url });
  }

  return successResponse({
    orderId: order.id,
    pending: true,
    message: result.message,
  });
}
