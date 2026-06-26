import { describe, expect, it } from "vitest";

import {
  canReactivateWithdrawnAccount,
  getWithdrawnAccountStatus,
  normalizeAccountEmail,
} from "@/lib/account/reactivate";

describe("withdrawn account reactivation policy", () => {
  const now = new Date("2026-06-20T12:00:00.000Z");

  it("탈퇴하지 않은 계정은 복구 대상이 아니다", () => {
    expect(
      getWithdrawnAccountStatus(
        { withdrawn_at: null, hard_delete_at: null },
        now,
      ),
    ).toEqual({ kind: "not_withdrawn" });
    expect(
      canReactivateWithdrawnAccount(
        { withdrawn_at: null, hard_delete_at: null },
        now,
      ),
    ).toBe(false);
  });

  it("보관 기간 내 탈퇴 계정은 복구할 수 있다", () => {
    const profile = {
      withdrawn_at: "2026-06-10T00:00:00.000Z",
      hard_delete_at: "2026-07-10T00:00:00.000Z",
    };

    expect(getWithdrawnAccountStatus(profile, now)).toEqual({
      kind: "can_reactivate",
    });
    expect(canReactivateWithdrawnAccount(profile, now)).toBe(true);
  });

  it("보관 기간이 지난 탈퇴 계정은 복구할 수 없다", () => {
    const profile = {
      withdrawn_at: "2026-05-01T00:00:00.000Z",
      hard_delete_at: "2026-05-31T00:00:00.000Z",
    };

    expect(getWithdrawnAccountStatus(profile, now)).toEqual({
      kind: "retention_expired",
    });
    expect(canReactivateWithdrawnAccount(profile, now)).toBe(false);
  });

  it("이메일은 소문자로 정규화한다", () => {
    expect(normalizeAccountEmail("  User@Example.COM ")).toBe("user@example.com");
  });
});
