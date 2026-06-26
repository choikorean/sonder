import { describe, expect, it } from "vitest";

import {
  TAX_CHANGE_REASON_CHIPS,
  combineChangeReasons,
} from "@/lib/report-explanation/change-reasons";
import {
  combineReportExplanationSections,
  parseReportExplanationJson,
} from "@/lib/report-explanation/output";

describe("combineChangeReasons", () => {
  it("선택 칩과 직접 입력을 합친다", () => {
    expect(
      combineChangeReasons(["매출 증가", "경비 증가"], "분납 적용"),
    ).toBe("매출 증가, 경비 증가, 분납 적용");
  });

  it("중복 칩을 제거한다", () => {
    expect(combineChangeReasons(["매출 증가", "매출 증가"])).toBe("매출 증가");
  });

  it("선택이 없으면 undefined를 반환한다", () => {
    expect(combineChangeReasons([])).toBeUndefined();
  });

  it("변동 사유 칩 목록을 제공한다", () => {
    expect(TAX_CHANGE_REASON_CHIPS.length).toBeGreaterThan(5);
  });
});

describe("report explanation output", () => {
  it("JSON 응답을 섹션으로 파싱한다", () => {
    const sections = parseReportExplanationJson({
      amountSummary: "이번 부가세는 100만원입니다.",
      changeExplanation: "매출이 증가했습니다.",
      paymentGuidance: "7월 25일까지 납부해 주세요.",
    });

    expect(sections.amountSummary).toContain("100만원");
    expect(sections.changeExplanation).toContain("매출");
    expect(sections.paymentGuidance).toContain("납부");
  });

  it("섹션을 전체 설명문으로 합친다", () => {
    const combined = combineReportExplanationSections({
      amountSummary: "금액 안내",
      changeExplanation: "해당 없음",
      paymentGuidance: "납부 안내",
    });

    expect(combined).toBe("금액 안내\n\n납부 안내");
  });
});
