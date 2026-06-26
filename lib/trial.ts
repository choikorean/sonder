import { FREE_TRIAL } from "@/lib/plans";
import type { CurrentSubscription } from "@/lib/subscription";

export type TrialRestoreAction =
  | { kind: "noop" }
  | { kind: "restore_trialing" }
  | { kind: "mark_inactive" };

export function isTrialPeriodValid(
  trialEndsAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (!trialEndsAt) {
    return true;
  }
  return new Date(trialEndsAt).getTime() > now.getTime();
}

/** 무료 체험 기간이 끝났고 유료 전환 전인 계정 */
export function isTrialExpired(
  subscription: CurrentSubscription,
  now = new Date(),
): boolean {
  if (!subscription.trialEndsAt) {
    return false;
  }
  if (subscription.isTrialing) {
    return false;
  }
  if (subscription.planId !== "free") {
    return false;
  }
  return new Date(subscription.trialEndsAt).getTime() <= now.getTime();
}

export function resolveTrialRestoreAction(
  subscription: {
    status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
  } | null,
  now = new Date(),
): TrialRestoreAction {
  if (!subscription) {
    return { kind: "noop" };
  }

  if (subscription.status === "active" || subscription.status === "trialing") {
    return { kind: "noop" };
  }

  const trialEndsAt =
    subscription.trial_ends_at ?? subscription.current_period_end;
  if (!trialEndsAt) {
    return { kind: "mark_inactive" };
  }

  if (isTrialPeriodValid(trialEndsAt, now)) {
    return { kind: "restore_trialing" };
  }

  return { kind: "mark_inactive" };
}

export function getTrialUsageSinceIso(
  subscription: CurrentSubscription,
): string | null {
  return (
    subscription.startedAt ??
    subscription.currentPeriodStart ??
    null
  );
}

export function usagePeriodLabel(subscription: CurrentSubscription): string {
  if (subscription.isTrialing) {
    return "체험 기간 생성";
  }
  return "이번 달 생성";
}

export function trialExpiredMessage(): string {
  return "무료 체험 기간이 종료되었습니다. 생성 내역은 조회할 수 있으며, 계속 이용하려면 요금제를 선택해 주세요.";
}

export function usageLimitMessage(
  planName: string,
  limit: number,
  options?: {
    isTrialing?: boolean;
    trialExpired?: boolean;
  },
): string {
  if (options?.trialExpired) {
    return trialExpiredMessage();
  }

  if (options?.isTrialing) {
    return `체험 기간 생성 한도(${FREE_TRIAL.generationLimit.toLocaleString()}건)를 모두 사용했습니다. 요금제를 선택하면 계속 이용하실 수 있습니다.`;
  }

  return `이번 달 생성 한도(${limit.toLocaleString()}건, ${planName} 플랜)를 모두 사용했습니다. 요금제를 업그레이드하면 계속 이용하실 수 있습니다.`;
}
