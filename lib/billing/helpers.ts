import "server-only";

import type { BillingCycle, PlanId } from "@/lib/plans";
import { FREE_TRIAL, getPlan } from "@/lib/plans";

export type PaidPlanId = Exclude<PlanId, "free">;
export type CheckoutType = "subscription" | "change_card";

export function planGoodsName(
  planId: PaidPlanId,
  cycle: BillingCycle,
): string {
  const plan = getPlan(planId);
  const cycleLabel = cycle === "yearly" ? "연" : "월";
  return `TaxFlo ${plan.name} ${cycleLabel} 구독`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

export function nextPeriodEnd(
  from: Date,
  cycle: BillingCycle,
): Date {
  return cycle === "yearly" ? addYears(from, 1) : addMonths(from, 1);
}

export function trialEndDate(from = new Date()): Date {
  return addDays(from, FREE_TRIAL.days);
}

export const BILLING_STATUS_LABELS: Record<string, string> = {
  active: "이용 중",
  trialing: "무료 체험 중",
  past_due: "결제 실패",
  canceled: "해지 예정",
  inactive: "미구독",
  suspended: "정지",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  paid: "결제완료",
  failed: "실패",
  canceled: "취소",
};

export function formatBillingDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatPaymentDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR");
}
