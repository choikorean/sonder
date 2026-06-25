import type { createClient } from "@/lib/supabase/server";
import { FREE_TRIAL, type Plan, type PlanId } from "@/lib/plans";
import {
  getPlanCapabilities,
  needsPromptProfile,
  type PlanCapabilities,
} from "@/lib/plan-capabilities";
import { getOrganizationContext, type OrganizationContext } from "@/lib/org";
import { canManageBilling } from "@/lib/billing/access";
import { getSubscription, type CurrentSubscription } from "@/lib/subscription";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export type PromptProfile = {
  officeName: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
};

export type SubscriberContext = {
  subscription: CurrentSubscription;
  /** 한도 계산에 쓰는 플랜 (체험 중 free → free 한도) */
  limitPlan: Plan;
  /** 기능 제공에 쓰는 플랜 id (체험 중에는 pro 수준 capability) */
  featurePlanId: PlanId;
  capabilities: PlanCapabilities;
  /** 생성 한도·보관 일수는 limitPlan / retentionDays / monthlyLimit 참고 */
  retentionDays: number;
  monthlyLimit: number;
  /** officeSignature가 true일 때만 로드 (사무소명·담당자명 삽입용) */
  profile: PromptProfile | null;
  /** Team 멀티유저 조직 (없으면 null) */
  organization: OrganizationContext | null;
  /** 결제·구독 변경 가능 여부 (Team 팀원은 false) */
  canManageBilling: boolean;
};

export async function getPromptProfile(
  supabase: SupabaseServer,
): Promise<PromptProfile> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return {
      officeName: null,
      contactName: null,
      phone: null,
      email: null,
    };
  }

  const { data } = await supabase
    .from("profiles")
    .select("name, office_name, phone, email")
    .eq("id", auth.user.id)
    .maybeSingle();

  return {
    officeName: data?.office_name ?? null,
    contactName: data?.name ?? null,
    phone: data?.phone ?? null,
    email: data?.email ?? auth.user?.email ?? null,
  };
}

export async function getSubscriberContext(
  supabase: SupabaseServer,
): Promise<SubscriberContext> {
  const { data: auth } = await supabase.auth.getUser();
  const subscription = await getSubscription(supabase);
  const capabilities = getPlanCapabilities(subscription.effectivePlanId, {
    isTrialing: subscription.isTrialing,
  });

  const limitPlan = subscription.plan;
  const monthlyLimit = subscription.isTrialing
    ? FREE_TRIAL.generationLimit
    : limitPlan.monthlyLimit;
  const retentionDays = subscription.isTrialing
    ? FREE_TRIAL.retentionDays
    : limitPlan.retentionDays;

  const profile = needsPromptProfile(capabilities)
    ? await getPromptProfile(supabase)
    : null;

  const organization = auth.user
    ? await getOrganizationContext(supabase, auth.user.id)
    : null;

  return {
    subscription,
    limitPlan,
    featurePlanId: subscription.isTrialing
      ? "pro"
      : subscription.effectivePlanId,
    capabilities,
    retentionDays,
    monthlyLimit,
    profile,
    organization,
    canManageBilling: canManageBilling(organization),
  };
}
