import { describe, expect, it } from "vitest";

import { resolveTrialRestoreAction } from "@/lib/trial";
import { mapSubscriptionRow } from "@/lib/subscription";
import {
  isTrialExpired,
  isTrialPeriodValid,
  usageLimitMessage,
} from "@/lib/trial";

describe("trial policy", () => {
  const now = new Date("2026-06-20T12:00:00.000Z");

  it("체험 종료일이 지나면 trialing을 비활성으로 본다", () => {
    const subscription = mapSubscriptionRow({
      plan: "free",
      status: "trialing",
      billing_cycle: "monthly",
      started_at: "2026-06-01T00:00:00.000Z",
      current_period_start: "2026-06-01T00:00:00.000Z",
      current_period_end: "2026-06-10T00:00:00.000Z",
      trial_ends_at: "2026-06-10T00:00:00.000Z",
      next_billing_at: "2026-06-10T00:00:00.000Z",
      cancel_at_period_end: false,
      canceled_at: null,
    });

    expect(subscription.isTrialing).toBe(false);
    expect(subscription.isActive).toBe(false);
  });

  it("탈퇴 복구 시 체험 기간이 남아 있으면 trialing만 복구한다", () => {
    expect(
      resolveTrialRestoreAction(
        {
          status: "canceled",
          trial_ends_at: "2026-07-01T00:00:00.000Z",
          current_period_end: "2026-07-01T00:00:00.000Z",
        },
        now,
      ),
    ).toEqual({ kind: "restore_trialing" });
  });

  it("탈퇴 복구 시 체험 기간이 지났으면 inactive로 둔다", () => {
    expect(
      resolveTrialRestoreAction(
        {
          status: "canceled",
          trial_ends_at: "2026-06-01T00:00:00.000Z",
          current_period_end: "2026-06-01T00:00:00.000Z",
        },
        now,
      ),
    ).toEqual({ kind: "mark_inactive" });
  });

  it("이미 trialing이면 복구 시 구독을 건드리지 않는다", () => {
    expect(
      resolveTrialRestoreAction(
        {
          status: "trialing",
          trial_ends_at: "2026-07-01T00:00:00.000Z",
          current_period_end: "2026-07-01T00:00:00.000Z",
        },
        now,
      ),
    ).toEqual({ kind: "noop" });
  });

  it("체험 만료 free 계정은 생성 불가 상태로 본다", () => {
    const subscription = mapSubscriptionRow({
      plan: "free",
      status: "inactive",
      billing_cycle: "monthly",
      started_at: "2026-05-01T00:00:00.000Z",
      current_period_start: "2026-05-01T00:00:00.000Z",
      current_period_end: "2026-05-15T00:00:00.000Z",
      trial_ends_at: "2026-05-15T00:00:00.000Z",
      next_billing_at: null,
      cancel_at_period_end: false,
      canceled_at: "2026-06-01T00:00:00.000Z",
    });

    expect(isTrialExpired(subscription, now)).toBe(true);
    expect(isTrialPeriodValid(subscription.trialEndsAt, now)).toBe(false);
  });

  it("체험 만료와 한도 초과 메시지를 구분한다", () => {
    expect(
      usageLimitMessage("무료 체험", 30, { trialExpired: true }),
    ).toContain("체험 기간이 종료");
    expect(
      usageLimitMessage("무료 체험", 30, { isTrialing: true }),
    ).toContain("체험 기간 생성 한도");
  });
});
