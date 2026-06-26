import type { CurrentSubscription } from "@/lib/subscription";

export const ACCOUNT_DATA_RETENTION_DAYS = 30;

export type AccountWithdrawalUiState =
  | { kind: "available" }
  | { kind: "cancel_required" }
  | { kind: "team_owner_blocked"; memberCount: number };

/** 유료 구독 중(체험 제외) 해지 예약 없이는 탈퇴 불가 — 결제 관리자만 해당 */
export function mustCancelBeforeWithdraw(
  subscription: CurrentSubscription,
  canManageBilling: boolean,
): boolean {
  if (!canManageBilling) {
    return false;
  }

  if (subscription.isTrialing) {
    return false;
  }

  if (subscription.cancelAtPeriodEnd) {
    return false;
  }

  if (!subscription.isActive) {
    return false;
  }

  return subscription.planId !== "free";
}

export function canWithdrawAccount(
  subscription: CurrentSubscription,
  canManageBilling: boolean,
): boolean {
  if (mustCancelBeforeWithdraw(subscription, canManageBilling)) {
    return false;
  }

  if (subscription.isTrialing) {
    return true;
  }

  if (subscription.cancelAtPeriodEnd) {
    return true;
  }

  if (!subscription.isActive) {
    return true;
  }

  if (!canManageBilling) {
    return true;
  }

  return false;
}

export function getAccountWithdrawalUiState(input: {
  subscription: CurrentSubscription;
  canManageBilling: boolean;
  isTeamOwner: boolean;
  activeTeamMemberCount: number;
}): AccountWithdrawalUiState {
  if (input.isTeamOwner && input.activeTeamMemberCount > 1) {
    return {
      kind: "team_owner_blocked",
      memberCount: input.activeTeamMemberCount,
    };
  }

  if (mustCancelBeforeWithdraw(input.subscription, input.canManageBilling)) {
    return { kind: "cancel_required" };
  }

  if (
    canWithdrawAccount(input.subscription, input.canManageBilling)
  ) {
    return { kind: "available" };
  }

  return { kind: "cancel_required" };
}

export function canAccessCancelSubscriptionPage(
  subscription: CurrentSubscription,
): boolean {
  return (
    subscription.isActive &&
    !subscription.isTrialing &&
    !subscription.cancelAtPeriodEnd
  );
}
