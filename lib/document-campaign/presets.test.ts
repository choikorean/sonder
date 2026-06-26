import { describe, expect, it } from "vitest";

import { computeCampaignItemStats } from "@/lib/document-campaign/types";
import {
  buildCampaignTitleFromPreset,
  getSeasonPreset,
  resolveCampaignPresetDefaults,
} from "@/lib/document-campaign/presets";

describe("document campaign presets", () => {
  it("시즌 프리셋을 조회한다", () => {
    const preset = getSeasonPreset("vat_h1_final");
    expect(preset?.taxType).toBe("VAT");
    expect(preset?.label).toBe("부가세 1기 확정");
  });

  it("프리셋으로 캠페인 제목·메모·기한을 채운다", () => {
    const now = new Date("2026-06-20T12:00:00.000Z");
    const defaults = resolveCampaignPresetDefaults({
      seasonPresetId: "income_tax",
      now,
    });

    expect(defaults.title).toBe("2026년 종합소득세 자료 요청");
    expect(defaults.taxType).toBe("INCOME_TAX");
    expect(defaults.memo).toContain("종합소득세");
    expect(defaults.submissionDeadlineLabel).toContain("2026");
  });

  it("캠페인 항목 통계를 집계한다", () => {
    const stats = computeCampaignItemStats([
      { status: "not_requested" },
      { status: "partial" },
      { status: "completed" },
      { status: "rerequest_needed" },
    ]);

    expect(stats.total).toBe(4);
    expect(stats.pending).toBe(3);
    expect(stats.completed).toBe(1);
  });

  it("연도가 포함된 제목을 만든다", () => {
    const preset = getSeasonPreset("corporate_tax");
    expect(preset).not.toBeNull();
    expect(buildCampaignTitleFromPreset(preset!, new Date("2026-01-15"))).toBe(
      "2026년 법인세 자료 요청",
    );
  });
});
