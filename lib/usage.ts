import type { createClient } from "@/lib/supabase/server";
import { type Feature } from "@/lib/constants";
import { type Plan } from "@/lib/plans";
import { getSubscriberContext } from "@/lib/subscriber-context";
import {
  getTrialUsageSinceIso,
  isTrialExpired,
  usageLimitMessage,
  usagePeriodLabel,
} from "@/lib/trial";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

function monthStartISO(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

async function resolveUsageUserIds(
  supabase: SupabaseServer,
): Promise<string[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const ctx = await getSubscriberContext(supabase);
  if (
    ctx.organization &&
    ctx.subscription.effectivePlanId === "team" &&
    ctx.subscription.isActive
  ) {
    return ctx.organization.memberUserIds;
  }

  return [auth.user.id];
}

async function resolveUsageSinceIso(
  supabase: SupabaseServer,
): Promise<string> {
  const ctx = await getSubscriberContext(supabase);
  if (ctx.subscription.isTrialing) {
    const since = getTrialUsageSinceIso(ctx.subscription);
    if (since) {
      return since;
    }
  }
  return monthStartISO();
}

/** 체험 중에는 체험 시작일부터, 그 외에는 이번 달(UTC) 생성 횟수 */
export async function getMonthlyUsageTotal(
  supabase: SupabaseServer,
): Promise<number> {
  const userIds = await resolveUsageUserIds(supabase);
  if (userIds.length === 0) return 0;

  const since = await resolveUsageSinceIso(supabase);

  const { count } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .in("user_id", userIds)
    .gte("created_at", since);
  return count ?? 0;
}

const EMPTY_BY_FEATURE: Record<Feature, number> = {
  request_generation: 0,
  consultation_summary: 0,
  report_explanation: 0,
};

/** 기능별 생성 횟수 (체험 중에는 체험 기간 누적) */
export async function getMonthlyUsageByFeature(
  supabase: SupabaseServer,
): Promise<Record<Feature, number>> {
  const userIds = await resolveUsageUserIds(supabase);
  if (userIds.length === 0) return { ...EMPTY_BY_FEATURE };

  const since = await resolveUsageSinceIso(supabase);

  const { data } = await supabase
    .from("usage_events")
    .select("feature")
    .in("user_id", userIds)
    .gte("created_at", since);

  const result = { ...EMPTY_BY_FEATURE };
  for (const row of data ?? []) {
    if (row.feature && row.feature in result) {
      result[row.feature as Feature] += 1;
    }
  }
  return result;
}

export type UsageStatus = {
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
  isTrialing: boolean;
  trialExpired: boolean;
  usagePeriodLabel: string;
  plan: Plan;
};

/**
 * 현재 사용자의 플랜 한도 대비 사용량을 반환합니다.
 * 무료 체험은 기간 누적 30건, 유료 플랜은 이번 달 합산입니다.
 */
export async function getUsageStatus(
  supabase: SupabaseServer,
): Promise<UsageStatus> {
  const ctx = await getSubscriberContext(supabase);
  const subscription = ctx.subscription;
  const limit = ctx.monthlyLimit;
  const used = await getMonthlyUsageTotal(supabase);
  const trialExpired = isTrialExpired(subscription);
  const periodLabel = usagePeriodLabel(subscription);
  const allowed = !trialExpired && used < limit;

  return {
    used,
    limit,
    remaining: trialExpired ? 0 : Math.max(0, limit - used),
    allowed,
    isTrialing: subscription.isTrialing,
    trialExpired,
    usagePeriodLabel: periodLabel,
    plan: ctx.limitPlan,
  };
}

export function formatUsageLimitMessage(usage: UsageStatus): string {
  return usageLimitMessage(usage.plan.name, usage.limit, {
    isTrialing: usage.isTrialing,
    trialExpired: usage.trialExpired,
  });
}

export async function recordUsage(
  supabase: SupabaseServer,
  userId: string,
  feature: Feature,
  tokensEstimated?: number | null,
): Promise<void> {
  await supabase.from("usage_events").insert({
    user_id: userId,
    feature,
    tokens_estimated: tokensEstimated ?? null,
  });
}

export { usageLimitMessage };
