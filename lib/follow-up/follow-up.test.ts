import { describe, expect, it } from "vitest";

import { buildDocumentRequestLink } from "@/lib/follow-up/links";
import { parseNextActions } from "@/lib/follow-up/parse-actions";

describe("parseNextActions", () => {
  it("줄바꿈·불릿·번호 목록을 파싱한다", () => {
    expect(
      parseNextActions(`- 홈택스 매출 조회
1. 통장 내역 요청
• 담당자 확인`),
    ).toEqual(["홈택스 매출 조회", "통장 내역 요청", "담당자 확인"]);
  });

  it("해당 없음은 빈 배열을 반환한다", () => {
    expect(parseNextActions("해당 없음")).toEqual([]);
    expect(parseNextActions(null)).toEqual([]);
  });

  it("단일 문장도 하나의 항목으로 반환한다", () => {
    expect(parseNextActions("고객에게 자료 요청 메일 발송")).toEqual([
      "고객에게 자료 요청 메일 발송",
    ]);
  });
});

describe("buildDocumentRequestLink", () => {
  it("고객·자료·상담 요약을 쿼리로 전달한다", () => {
    const href = buildDocumentRequestLink({
      clientId: "11111111-1111-1111-1111-111111111111",
      requiredDocuments: "통장 내역",
      consultationSummary: "부가세 신고 상담",
    });

    expect(href).toContain("clientId=11111111-1111-1111-1111-111111111111");
    expect(href).toContain("memo=");
    const memo = new URLSearchParams(href.split("?")[1]).get("memo");
    expect(memo).toContain("통장 내역");
    expect(memo).toContain("부가세 신고 상담");
  });
});
