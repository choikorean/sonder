import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { isAuthorizedCronSecret } from "@/lib/cron-auth";

describe("isAuthorizedCronSecret", () => {
  it("등록된 Bearer 토큰을 허용한다", () => {
    vi.stubEnv("TAX_SCHEDULE_CRON_SECRET", "test-secret");

    const request = new NextRequest("http://localhost/api/cron/tax-schedule-sync", {
      headers: { authorization: "Bearer test-secret" },
    });

    expect(
      isAuthorizedCronSecret(request, ["TAX_SCHEDULE_CRON_SECRET", "CRON_SECRET"]),
    ).toBe(true);

    vi.unstubAllEnvs();
  });

  it("토큰이 없으면 거부한다", () => {
    vi.stubEnv("TAX_SCHEDULE_CRON_SECRET", "test-secret");

    const request = new NextRequest("http://localhost/api/cron/tax-schedule-sync");

    expect(
      isAuthorizedCronSecret(request, ["TAX_SCHEDULE_CRON_SECRET", "CRON_SECRET"]),
    ).toBe(false);

    vi.unstubAllEnvs();
  });
});
