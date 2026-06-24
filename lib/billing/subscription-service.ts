import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  approveBilling,
  getNicepayConfig,
  registerBillkey,
  removeBillkey,
  signAuthResponse,
  createMoid,
  createTid,
  type AuthCallbackPayload,
} from "@/lib/nicepay";
import {
  nextPeriodEnd,
  planGoodsName,
  trialEndDate,
  type CheckoutType,
  type PaidPlanId,
} from "@/lib/billing/helpers";
import { ensureTeamOrganization } from "@/lib/org";
import {
  getPlan,
  planPrice,
  type BillingCycle,
} from "@/lib/plans";

type ServiceClient = ReturnType<typeof createServiceClient>;

import type { Json } from "@/types/database";

export async function recordBillingEvent(
  supabase: ServiceClient,
  userId: string,
  eventType: string,
  payload: Record<string, unknown>,
) {
  await supabase.from("billing_events").insert({
    user_id: userId,
    event_type: eventType,
    payload: payload as Json,
  });
}

export async function getPaymentOrderByMoid(
  supabase: ServiceClient,
  moid: string,
) {
  const { data, error } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("moid", moid)
    .maybeSingle();

  if (error || !data) {
    throw new Error("결제 주문을 찾을 수 없습니다.");
  }

  return data;
}

export async function getActiveBillingKey(
  supabase: ServiceClient,
  userId: string,
) {
  const { data } = await supabase
    .from("billing_keys")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function completeBillkeyRegistration(params: {
  userId: string;
  orderId: string;
  auth: AuthCallbackPayload;
}) {
  const supabase = createServiceClient();
  const config = getNicepayConfig();

  if (params.auth.AuthResultCode !== "0000") {
    await supabase
      .from("payment_orders")
      .update({ status: "failed" })
      .eq("id", params.orderId);

    throw new Error(params.auth.AuthResultMsg || "카드 인증에 실패했습니다.");
  }

  const order = await getPaymentOrderByMoid(supabase, params.auth.Moid ?? "");
  if (order.user_id !== params.userId || order.id !== params.orderId) {
    throw new Error("결제 주문 정보가 일치하지 않습니다.");
  }

  const expectedSignature = signAuthResponse(
    params.auth.AuthToken ?? "",
    params.auth.MID ?? config.mid,
    params.auth.Amt ?? String(order.amount),
    config.merchantKey,
  );

  if (
    params.auth.Signature &&
    params.auth.Signature.toLowerCase() !== expectedSignature.toLowerCase()
  ) {
    throw new Error("인증 응답 위변조 검증에 실패했습니다.");
  }

  const registerResult = await registerBillkey({
    tid: params.auth.TxTid ?? "",
    authToken: params.auth.AuthToken ?? "",
    mid: config.mid,
    merchantKey: config.merchantKey,
  });

  if (registerResult.ResultCode !== "F100" || !registerResult.BID) {
    await supabase
      .from("payment_orders")
      .update({
        status: "failed",
        auth_tid: params.auth.TxTid ?? null,
      })
      .eq("id", order.id);

    throw new Error(
      registerResult.ResultMsg || "빌키 발급에 실패했습니다.",
    );
  }

  const checkoutType = (order.checkout_type ?? "subscription") as CheckoutType;

  if (checkoutType === "change_card") {
    return finalizeCardChange(supabase, {
      userId: params.userId,
      order,
      registerResult,
      configMid: config.mid,
    });
  }

  return finalizeSubscriptionCheckout(supabase, {
    userId: params.userId,
    order,
    registerResult,
    configMid: config.mid,
  });
}

async function finalizeCardChange(
  supabase: ServiceClient,
  params: {
    userId: string;
    order: Awaited<ReturnType<typeof getPaymentOrderByMoid>>;
    registerResult: Awaited<ReturnType<typeof registerBillkey>>;
    configMid: string;
  },
) {
  const previousKey = await getActiveBillingKey(supabase, params.userId);

  const { data: newKey, error: keyError } = await supabase
    .from("billing_keys")
    .insert({
      user_id: params.userId,
      nicepay_bid: params.registerResult.BID!,
      nicepay_mid: params.configMid,
      card_name: params.registerResult.CardName ?? null,
      card_no_masked: params.registerResult.CardNo ?? null,
      card_code: params.registerResult.CardCode ?? null,
      card_cl: params.registerResult.CardCl ?? null,
      is_active: true,
      issued_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (keyError || !newKey) {
    throw new Error("새 결제수단 저장에 실패했습니다.");
  }

  if (previousKey) {
    await supabase
      .from("billing_keys")
      .update({
        is_active: false,
        removed_at: new Date().toISOString(),
      })
      .eq("id", previousKey.id);

    try {
      await removeBillkey({
        bid: previousKey.nicepay_bid,
        mid: params.configMid,
        merchantKey: getNicepayConfig().merchantKey,
        moid: createMoid("remove"),
        amt: params.order.amount,
      });
    } catch {
      // 기존 빌키 삭제 실패는 로그만 남기고 진행
    }
  }

  await supabase
    .from("payment_orders")
    .update({
      status: "completed",
      auth_tid: params.registerResult.TID ?? null,
      provider_order_id: params.registerResult.BID ?? null,
    })
    .eq("id", params.order.id);

  await recordBillingEvent(supabase, params.userId, "payment_method_changed", {
    orderId: params.order.id,
    cardName: params.registerResult.CardName,
    cardNoMasked: params.registerResult.CardNo,
  });

  return {
    checkoutType: "change_card" as const,
    cardName: params.registerResult.CardName ?? null,
    cardNoMasked: params.registerResult.CardNo ?? null,
  };
}

async function finalizeSubscriptionCheckout(
  supabase: ServiceClient,
  params: {
    userId: string;
    order: Awaited<ReturnType<typeof getPaymentOrderByMoid>>;
    registerResult: Awaited<ReturnType<typeof registerBillkey>>;
    configMid: string;
  },
) {
  const planId = params.order.plan as PaidPlanId;
  const cycle = params.order.billing_cycle as BillingCycle;
  const now = new Date();
  const trialEnds = trialEndDate(now);
  const nextBilling = trialEnds;

  const previousKey = await getActiveBillingKey(supabase, params.userId);
  if (previousKey) {
    await supabase
      .from("billing_keys")
      .update({
        is_active: false,
        removed_at: now.toISOString(),
      })
      .eq("id", previousKey.id);
  }

  await supabase.from("billing_keys").insert({
    user_id: params.userId,
    nicepay_bid: params.registerResult.BID!,
    nicepay_mid: params.configMid,
    card_name: params.registerResult.CardName ?? null,
    card_no_masked: params.registerResult.CardNo ?? null,
    card_code: params.registerResult.CardCode ?? null,
    card_cl: params.registerResult.CardCl ?? null,
    is_active: true,
    issued_at: now.toISOString(),
  });

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: params.userId,
        plan: planId,
        status: "trialing",
        billing_cycle: cycle,
        provider: "nicepay",
        provider_order_id: params.registerResult.BID ?? null,
        started_at: now.toISOString(),
        trial_ends_at: trialEnds.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: trialEnds.toISOString(),
        next_billing_at: nextBilling.toISOString(),
        cancel_at_period_end: false,
        canceled_at: null,
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();

  if (subError || !subscription) {
    throw new Error("구독 활성화에 실패했습니다.");
  }

  if (planId === "team") {
    await ensureTeamOrganization(supabase, {
      ownerUserId: params.userId,
      seatLimit: getPlan("team").seats,
    });
  }

  await supabase
    .from("payment_orders")
    .update({
      status: "completed",
      auth_tid: params.registerResult.TID ?? null,
      provider_order_id: params.registerResult.BID ?? null,
    })
    .eq("id", params.order.id);

  await recordBillingEvent(supabase, params.userId, "subscription_started", {
    orderId: params.order.id,
    planId,
    cycle,
    trialEndsAt: trialEnds.toISOString(),
  });

  return {
    checkoutType: "subscription" as const,
    planId,
    cycle,
    trialEndsAt: trialEnds.toISOString(),
    nextBillingAt: nextBilling.toISOString(),
    amount: params.order.amount,
    cardName: params.registerResult.CardName ?? null,
    cardNoMasked: params.registerResult.CardNo ?? null,
  };
}

export async function chargeSubscription(params: {
  userId: string;
  subscriptionId: string;
  planId: PaidPlanId;
  cycle: BillingCycle;
  amount: number;
  bid: string;
  buyerEmail?: string;
  buyerName?: string;
  buyerTel?: string;
}) {
  const supabase = createServiceClient();
  const config = getNicepayConfig();
  const goodsName = planGoodsName(params.planId, params.cycle);
  const moid = createMoid("pay");
  const tid = createTid(config.mid);

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      user_id: params.userId,
      subscription_id: params.subscriptionId,
      nicepay_tid: tid,
      moid,
      amount: params.amount,
      goods_name: goodsName,
      status: "pending",
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    throw new Error("결제 기록 생성에 실패했습니다.");
  }

  const result = await approveBilling({
    bid: params.bid,
    mid: config.mid,
    merchantKey: config.merchantKey,
    moid,
    amt: params.amount,
    goodsName,
    buyerEmail: params.buyerEmail,
    buyerName: params.buyerName,
    buyerTel: params.buyerTel,
  });

  const attemptNo = 1;
  await supabase.from("payment_attempts").insert({
    payment_id: payment.id,
    user_id: params.userId,
    attempt_no: attemptNo,
    result_code: result.ResultCode,
    result_msg: result.ResultMsg,
    raw_response: result,
  });

  const success = result.ResultCode === "3001";
  const now = new Date();

  if (success) {
    const periodStart = now;
    const periodEnd = nextPeriodEnd(periodStart, params.cycle);

    await supabase
      .from("payments")
      .update({
        status: "paid",
        result_code: result.ResultCode,
        result_msg: result.ResultMsg,
        auth_code: result.AuthCode ?? null,
        auth_date: result.AuthDate ?? null,
        nicepay_tid: result.TID ?? tid,
        paid_at: now.toISOString(),
        raw_response: result,
      })
      .eq("id", payment.id);

    await supabase
      .from("subscriptions")
      .update({
        plan: params.planId,
        status: "active",
        billing_cycle: params.cycle,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        next_billing_at: periodEnd.toISOString(),
        trial_ends_at: null,
        cancel_at_period_end: false,
      })
      .eq("id", params.subscriptionId);

    await recordBillingEvent(supabase, params.userId, "payment_succeeded", {
      paymentId: payment.id,
      moid,
      amount: params.amount,
    });

    return { success: true as const, paymentId: payment.id, result };
  }

  await supabase
    .from("payments")
    .update({
      status: "failed",
      result_code: result.ResultCode,
      result_msg: result.ResultMsg,
      failed_at: now.toISOString(),
      raw_response: result,
    })
    .eq("id", payment.id);

  await supabase
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("id", params.subscriptionId);

  await recordBillingEvent(supabase, params.userId, "payment_failed", {
    paymentId: payment.id,
    moid,
    resultCode: result.ResultCode,
    resultMsg: result.ResultMsg,
  });

  return { success: false as const, paymentId: payment.id, result };
}

export async function chargeDueSubscriptions(limit = 50) {
  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  const { data: dueSubs, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, plan, billing_cycle, status, cancel_at_period_end")
    .lte("next_billing_at", nowIso)
    .in("status", ["active", "trialing", "past_due"])
    .eq("cancel_at_period_end", false)
    .limit(limit);

  if (error) {
    throw new Error("구독 조회에 실패했습니다.");
  }

  const results: Array<{ subscriptionId: string; success: boolean }> = [];

  for (const sub of dueSubs ?? []) {
    if (sub.status === "trialing") {
      // 체험 종료 → 첫 결제
    }

    const billingKey = await getActiveBillingKey(supabase, sub.user_id);
    if (!billingKey) {
      await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("id", sub.id);
      results.push({ subscriptionId: sub.id, success: false });
      continue;
    }

    const planId = sub.plan as PaidPlanId;
    const cycle = sub.billing_cycle as BillingCycle;
    const amount = planPrice(getPlan(planId), cycle);

    const charge = await chargeSubscription({
      userId: sub.user_id,
      subscriptionId: sub.id,
      planId,
      cycle,
      amount,
      bid: billingKey.nicepay_bid,
    });

    results.push({ subscriptionId: sub.id, success: charge.success });
  }

  return results;
}

export async function cancelSubscriptionAtPeriodEnd(params: {
  userId: string;
  reason?: string;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString(),
    })
    .eq("user_id", params.userId)
    .in("status", ["active", "trialing", "past_due"])
    .select("id, current_period_end, status")
    .maybeSingle();

  if (error || !data) {
    throw new Error("구독 해지 예약에 실패했습니다.");
  }

  await recordBillingEvent(supabase, params.userId, "subscription_canceled", {
    reason: params.reason ?? null,
    effectiveUntil: data.current_period_end,
  });

  return data;
}

export async function removeUserBillkey(userId: string) {
  const supabase = createServiceClient();
  const config = getNicepayConfig();
  const billingKey = await getActiveBillingKey(supabase, userId);

  if (!billingKey) {
    return { removed: false };
  }

  const result = await removeBillkey({
    bid: billingKey.nicepay_bid,
    mid: config.mid,
    merchantKey: config.merchantKey,
    moid: createMoid("remove"),
    amt: 0,
  });

  if (result.ResultCode !== "F101") {
    throw new Error(result.ResultMsg || "빌키 삭제에 실패했습니다.");
  }

  await supabase
    .from("billing_keys")
    .update({
      is_active: false,
      removed_at: new Date().toISOString(),
    })
    .eq("id", billingKey.id);

  await recordBillingEvent(supabase, userId, "billkey_removed", {
    billingKeyId: billingKey.id,
  });

  return { removed: true };
}
