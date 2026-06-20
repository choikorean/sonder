import type { createClient } from "@/lib/supabase/server";
import {
  PLANS,
  isPlanId,
  isBillingCycle,
  type Plan,
  type PlanId,
  type BillingCycle,
} from "@/lib/plans";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export type CurrentSubscription = {
  /** 실제 구독 레코드의 플랜 (없으면 free) */
  planId: PlanId;
  /** 한도/권한 적용에 사용할 유효 플랜 (활성 아니면 free) */
  effectivePlanId: PlanId;
  plan: Plan;
  status: string;
  billingCycle: BillingCycle;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  nextBillingAt: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  /** active 또는 만료 전 trialing 여부 */
  isActive: boolean;
  isTrialing: boolean;
};

export async function getSubscription(
  supabase: SupabaseServer,
): Promise<CurrentSubscription> {
  const { data } = await supabase
    .from("subscriptions")
    .select(
      "plan, status, billing_cycle, current_period_start, current_period_end, trial_ends_at, next_billing_at, cancel_at_period_end, canceled_at",
    )
    .maybeSingle();

  const status = data?.status ?? "inactive";
  const planRaw = data?.plan ?? "free";
  const cycleRaw = data?.billing_cycle ?? "monthly";
  const currentPeriodStart = data?.current_period_start ?? null;
  const currentPeriodEnd = data?.current_period_end ?? null;
  const trialEndsAt = data?.trial_ends_at ?? null;
  const nextBillingAt = data?.next_billing_at ?? null;
  const cancelAtPeriodEnd = data?.cancel_at_period_end ?? false;
  const canceledAt = data?.canceled_at ?? null;

  const periodValid =
    !currentPeriodEnd || new Date(currentPeriodEnd).getTime() > Date.now();
  const isActive = (status === "active" || status === "trialing") && periodValid;
  const isTrialing = status === "trialing" && periodValid;

  const planId: PlanId = isPlanId(planRaw) ? planRaw : "free";
  const effectivePlanId: PlanId = isActive ? planId : "free";

  return {
    planId,
    effectivePlanId,
    plan: PLANS[effectivePlanId],
    status,
    billingCycle: isBillingCycle(cycleRaw) ? cycleRaw : "monthly",
    currentPeriodStart,
    currentPeriodEnd,
    trialEndsAt,
    nextBillingAt,
    cancelAtPeriodEnd,
    canceledAt,
    isActive,
    isTrialing,
  };
}
