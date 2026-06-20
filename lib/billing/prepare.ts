import "server-only";

import {
  createMoid,
  ediDate,
  getNicepayConfig,
  signAuthRequest,
} from "@/lib/nicepay";
import { planGoodsName, type CheckoutType } from "@/lib/billing/helpers";
import { getPlan, planPrice, type BillingCycle } from "@/lib/plans";
import type { PaidPlanId } from "@/lib/billing/helpers";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export type PrepareCheckoutInput = {
  supabase: SupabaseServer;
  userId: string;
  userEmail: string;
  userName?: string | null;
  userPhone?: string | null;
  planId: PaidPlanId;
  cycle: BillingCycle;
  checkoutType: CheckoutType;
  appUrl: string;
};

export async function prepareNicepayCheckout(input: PrepareCheckoutInput) {
  const config = getNicepayConfig();
  const plan = getPlan(input.planId);
  const amount = planPrice(plan, input.cycle);
  const goodsName = planGoodsName(input.planId, input.cycle);
  const moid = createMoid("tf");
  const edi = ediDate();
  const amt = String(amount);

  const { data: order, error } = await input.supabase
    .from("payment_orders")
    .insert({
      user_id: input.userId,
      plan: input.planId,
      billing_cycle: input.cycle,
      amount,
      status: "pending",
      provider: "nicepay",
      moid,
      checkout_type: input.checkoutType,
      goods_name: goodsName,
      metadata: {
        consentedAt: new Date().toISOString(),
      },
    })
    .select("id, moid, amount")
    .single();

  if (error || !order) {
    throw new Error("결제 준비에 실패했습니다.");
  }

  const returnUrl = `${input.appUrl}/api/billing/auth-callback`;
  const signData = signAuthRequest(edi, config.mid, amt, config.merchantKey);

  return {
    orderId: order.id,
    nicepayForm: {
      GoodsName: goodsName,
      Amt: amt,
      MID: config.mid,
      EdiDate: edi,
      Moid: order.moid!,
      PayMethod: "CARD",
      BillAuthYN: "Y",
      SignData: signData,
      BuyerEmail: input.userEmail,
      BuyerName: input.userName ?? input.userEmail.split("@")[0],
      BuyerTel: input.userPhone ?? "01000000000",
      CharSet: config.charset,
      ReturnURL: returnUrl,
      ReqReserved: order.id,
    },
    returnUrl,
    amount,
    goodsName,
    planName: plan.name,
  };
}
