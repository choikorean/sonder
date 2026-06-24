import type { createClient } from "@/lib/supabase/server";
import { type Feature } from "@/lib/constants";
import { type Plan } from "@/lib/plans";
import { getSubscriberContext } from "@/lib/subscriber-context";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

function monthStartISO(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

/** 이번 달(UTC 월초 기준) 전체 기능 합산 생성 횟수 */
export async function getMonthlyUsageTotal(
  supabase: SupabaseServer,
): Promise<number> {
  const { count } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .gte("created_at", monthStartISO());
  return count ?? 0;
}

const EMPTY_BY_FEATURE: Record<Feature, number> = {
  request_generation: 0,
  consultation_summary: 0,
  report_explanation: 0,
};

/** 이번 달 기능별 생성 횟수 */
export async function getMonthlyUsageByFeature(
  supabase: SupabaseServer,
): Promise<Record<Feature, number>> {
  const { data } = await supabase
    .from("current_month_usage")
    .select("feature, usage_count");

  const result = { ...EMPTY_BY_FEATURE };
  for (const row of data ?? []) {
    if (row.feature && row.feature in result) {
      result[row.feature as Feature] = row.usage_count ?? 0;
    }
  }
  return result;
}

export type UsageStatus = {
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
  plan: Plan;
};

/**
 * 현재 사용자의 활성 플랜 한도 대비 이번 달 사용량을 반환합니다.
 * 한도 검사는 항상 서버에서 이 함수를 통해 수행합니다.
 */
export async function getUsageStatus(
  supabase: SupabaseServer,
): Promise<UsageStatus> {
  const ctx = await getSubscriberContext(supabase);
  const limit = ctx.monthlyLimit;
  const used = await getMonthlyUsageTotal(supabase);
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    allowed: used < limit,
    plan: ctx.limitPlan,
  };
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

export function usageLimitMessage(plan: Plan): string {
  return `이번 달 생성 한도(${plan.monthlyLimit.toLocaleString()}건, ${plan.name} 플랜)를 모두 사용했습니다. 요금제를 업그레이드하면 계속 이용하실 수 있습니다.`;
}
