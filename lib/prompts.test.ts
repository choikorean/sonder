import { describe, expect, it } from "vitest";

import {
  buildConsultationSummaryPrompt,
  buildDocumentRequestPrompt,
  buildTaxExplanationPrompt,
} from "@/lib/prompts";

const SAMPLE_SCHEDULE = `\n\n참고: 국세청 세무일정(공식 게시 기준, 초안 작성 참고용)
- 2026-06-10: 부가가치세 확정신고 납부 (1기 확정)
※ 위 일정은 참고용입니다. 임의로 날짜·기한을 만들지 말고, 제공된 일정만 인용하세요. 생성문 본문에 출처 표기는 하지 마세요.`;

describe("buildDocumentRequestPrompt", () => {
  it("세무일정 참고 블록을 system 프롬프트에 포함한다", () => {
    const { system } = buildDocumentRequestPrompt({
      taxType: "VAT",
      businessType: "ECOMMERCE",
      scheduleContext: SAMPLE_SCHEDULE,
    });

    expect(system).toContain("부가가치세 확정신고 납부");
    expect(system).toContain("자료 제출 기한은 사용자 조건의 날짜를 우선");
    expect(system).toContain("국세청 세무일정이 참고 블록으로 제공된 경우");
  });

  it("일정 블록이 없으면 참고 일정 문구를 넣지 않는다", () => {
    const { system } = buildDocumentRequestPrompt({
      taxType: "VAT",
      businessType: "ECOMMERCE",
    });

    expect(system).not.toContain("부가가치세 확정신고 납부");
  });
});

describe("buildConsultationSummaryPrompt", () => {
  it("세무일정 참고 블록을 system 프롬프트에 포함한다", () => {
    const { system } = buildConsultationSummaryPrompt({
      text: "부가세 신고 관련 상담",
      scheduleContext: SAMPLE_SCHEDULE,
    });

    expect(system).toContain("부가가치세 확정신고 납부");
    expect(system).toContain("nextActions·nextGuidance 작성 시");
  });
});

describe("buildTaxExplanationPrompt", () => {
  it("세무일정 참고 블록을 system 프롬프트에 포함한다", () => {
    const { system } = buildTaxExplanationPrompt({
      taxType: "VAT",
      currentTax: 1_000_000,
      scheduleContext: SAMPLE_SCHEDULE,
    });

    expect(system).toContain("부가가치세 확정신고 납부");
    expect(system).toContain("납부기한 미제공 시 임의로 기한을 적지 마세요");
  });
});
