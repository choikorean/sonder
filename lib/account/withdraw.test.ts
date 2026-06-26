import { describe, expect, it } from "vitest";

import {
  canAccessCancelSubscriptionPage,
  canWithdrawAccount,
  getAccountWithdrawalUiState,
  mustCancelBeforeWithdraw,
} from "@/lib/account/withdraw";
import { mapSubscriptionRow } from "@/lib/subscription";

const trialing = mapSubscriptionRow({
  plan: "free",
  status: "trialing",
  billing_cycle: "monthly",
  started_at: null,
  current_period_start: null,
  current_period_end: new Date(Date.now() + 86400000 * 7).toISOString(),
  trial_ends_at: new Date(Date.now() + 86400000 * 7).toISOString(),
  next_billing_at: null,
  cancel_at_period_end: false,
  canceled_at: null,
});

const activePaid = mapSubscriptionRow({
  plan: "pro",
  status: "active",
  billing_cycle: "monthly",
  started_at: new Date().toISOString(),
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 86400000 * 20).toISOString(),
  trial_ends_at: null,
  next_billing_at: new Date(Date.now() + 86400000 * 20).toISOString(),
  cancel_at_period_end: false,
  canceled_at: null,
});

const cancelScheduled = mapSubscriptionRow({
  plan: "pro",
  status: "active",
  billing_cycle: "monthly",
  started_at: new Date().toISOString(),
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 86400000 * 10).toISOString(),
  trial_ends_at: null,
  next_billing_at: null,
  cancel_at_period_end: true,
  canceled_at: new Date().toISOString(),
});

const inactive = mapSubscriptionRow(null);

describe("account withdrawal policy", () => {
  it("무료 체험 회원은 구독 해지 페이지에 접근할 수 없다", () => {
    expect(canAccessCancelSubscriptionPage(trialing)).toBe(false);
  });

  it("유료 구독 중이면 구독 해지를 먼저 요구한다", () => {
    expect(mustCancelBeforeWithdraw(activePaid, true)).toBe(true);
    expect(canWithdrawAccount(activePaid, true)).toBe(false);
  });

  it("무료 체험 회원은 탈퇴할 수 있다", () => {
    expect(canWithdrawAccount(trialing, true)).toBe(true);
    expect(getAccountWithdrawalUiState({
      subscription: trialing,
      canManageBilling: true,
      isTeamOwner: false,
      activeTeamMemberCount: 0,
    })).toEqual({ kind: "available" });
  });

  it("해지 예정 회원은 탈퇴할 수 있다", () => {
    expect(canWithdrawAccount(cancelScheduled, true)).toBe(true);
  });

  it("미구독 회원은 탈퇴할 수 있다", () => {
    expect(canWithdrawAccount(inactive, true)).toBe(true);
  });

  it("팀원은 조직 구독 중에도 탈퇴할 수 있다", () => {
    expect(canWithdrawAccount(activePaid, false)).toBe(true);
  });
});
