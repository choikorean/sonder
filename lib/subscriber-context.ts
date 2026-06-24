import type { createClient } from "@/lib/supabase/server";
import { FREE_TRIAL, type Plan, type PlanId } from "@/lib/plans";
import {
  getPlanCapabilities,
  type PlanCapabilities,
} from "@/lib/plan-capabilities";
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
  /** 기능 제공에 쓰는 플랜 id */
  featurePlanId: PlanId;
  capabilities: PlanCapabilities;
  retentionDays: number;
  monthlyLimit: number;
  profile: PromptProfile | null;
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

  const profile =
    capabilities.officeSignature || capabilities.savedPhrases
      ? await getPromptProfile(supabase)
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
  };
}
