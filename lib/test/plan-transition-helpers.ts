import type { PlanId } from "@/lib/plans";
import { FREE_TRIAL, PLANS } from "@/lib/plans";
import {
  canManageClients,
  canManagePhrases,
  getPlanCapabilities,
  type PlanCapabilities,
} from "@/lib/plan-capabilities";
import {
  mapSubscriptionRow,
} from "@/lib/subscription";

type SubscriptionRowInput = {
  plan: PlanId;
  status: "active" | "trialing" | "inactive" | "past_due" | "canceled";
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
};

function futureIso(days = 30) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function pastIso(days = 1) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

/** getSubscriberContext와 동일한 capability·한도 계산 (DB 없이 플랜 전환 시뮬레이션) */
export function buildSubscriberSnapshot(row: SubscriptionRowInput) {
  const subscription = mapSubscriptionRow({
    plan: row.plan,
    status: row.status,
    billing_cycle: "monthly",
    started_at: null,
    current_period_start: null,
    current_period_end: row.current_period_end ?? futureIso(),
    trial_ends_at: row.status === "trialing" ? row.current_period_end ?? futureIso() : null,
    next_billing_at: null,
    cancel_at_period_end: row.cancel_at_period_end ?? false,
    canceled_at: null,
  });

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

  return {
    subscription,
    capabilities,
    monthlyLimit,
    retentionDays,
  };
}

export function activeRow(plan: PlanId): SubscriptionRowInput {
  return { plan, status: "active", current_period_end: futureIso() };
}

export function trialingRow(plan: PlanId = "free"): SubscriptionRowInput {
  return { plan, status: "trialing", current_period_end: futureIso(14) };
}

export function expiredRow(plan: PlanId): SubscriptionRowInput {
  return { plan, status: "active", current_period_end: pastIso() };
}

export function capabilityFlags(capabilities: PlanCapabilities) {
  return {
    clients: canManageClients(capabilities),
    phrases: canManagePhrases(capabilities),
    fullConsultation: capabilities.fullConsultationOutput,
    officeSignature: capabilities.officeSignature,
    officePhrases: capabilities.officeSharedPhrases,
    reviewSummary: capabilities.reviewSummary,
  };
}

export type PlanSnapshot = ReturnType<typeof buildSubscriberSnapshot>;

export function transition(
  from: PlanSnapshot,
  toRow: SubscriptionRowInput,
): { before: PlanSnapshot; after: PlanSnapshot } {
  return { before: from, after: buildSubscriberSnapshot(toRow) };
}
