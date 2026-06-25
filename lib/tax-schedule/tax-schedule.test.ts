import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { classifyTaxScheduleEvent, detectTaxTypesInText } from "@/lib/tax-schedule/classify";
import {
  buildNtsScheduleUrl,
  parseNtsTaxScheduleHtml,
} from "@/lib/tax-schedule/nts-parser";
import {
  getKstYearMonth,
  getWindowDateRange,
  iterSyncMonths,
} from "@/lib/tax-schedule/window";
import {
  buildCalendarCells,
  groupEventsByDate,
  shiftMonth,
} from "@/lib/tax-schedule/calendar";
import {
  filterTaxScheduleEventsForPrompt,
  formatTaxSchedulePromptBlock,
} from "@/lib/tax-schedule/prompt-context";
import type { TaxScheduleEvent } from "@/lib/tax-schedule/types";
import { addKstDays, getKstIsoDate } from "@/lib/tax-schedule/window";

const fixturePath = path.join(
  import.meta.dirname,
  "fixtures",
  "2026-06.html",
);
const fixtureHtml = readFileSync(fixturePath, "utf8");

describe("parseNtsTaxScheduleHtml", () => {
  it("2026-06 픽스처에서 일정 행을 파싱한다", () => {
    const events = parseNtsTaxScheduleHtml(fixtureHtml, 2026, 6);

    expect(events).toHaveLength(5);
    expect(events[0]).toMatchObject({
      eventDate: "2026-06-01",
      title: "2025귀속 종합소득세 확정신고 납부",
      note: "2025년 귀속분",
    });
    expect(events[1]?.title).toContain("원천세");
  });

  it("국세청 일정 URL을 생성한다", () => {
    expect(buildNtsScheduleUrl(2026, 6)).toBe(
      "https://www.nts.go.kr/nts/ad/taxSchdul/selectList.do?taxYear=2026&taxMonth=06&mi=135747",
    );
  });
});

describe("classifyTaxScheduleEvent", () => {
  it("제목·비고 키워드로 세목을 분류한다", () => {
    expect(
      classifyTaxScheduleEvent("2025귀속 종합소득세 확정신고 납부"),
    ).toContain("INCOME_TAX");
    expect(classifyTaxScheduleEvent("원천세 신고 납부기한")).toContain(
      "WITHHOLDING_TAX",
    );
    expect(classifyTaxScheduleEvent("부가가치세 확정신고 납부")).toContain(
      "VAT",
    );
    expect(classifyTaxScheduleEvent("법인세 중간예납")).toContain(
      "CORPORATE_TAX",
    );
    expect(classifyTaxScheduleEvent("근로소득 연말정산 자료 제출")).toContain(
      "YEAR_END_SETTLEMENT",
    );
  });

  it("매칭 키워드가 없으면 빈 배열을 반환한다", () => {
    expect(classifyTaxScheduleEvent("세무서 방문 안내")).toEqual([]);
  });

  it("상담 텍스트에서 세목을 감지한다", () => {
    expect(detectTaxTypesInText("부가세 신고와 원천세 정리가 필요합니다")).toEqual(
      expect.arrayContaining(["VAT", "WITHHOLDING_TAX"]),
    );
  });
});

describe("tax schedule sync window", () => {
  it("KST 기준 13개월 윈도우를 계산한다", () => {
    const now = new Date("2026-06-15T00:00:00+09:00");
    const { year, month } = getKstYearMonth(now);
    const months = iterSyncMonths(year, month, 13);
    const window = getWindowDateRange(year, month, 13);

    expect(year).toBe(2026);
    expect(month).toBe(6);
    expect(months).toHaveLength(13);
    expect(months[0]).toEqual({ year: 2026, month: 6 });
    expect(months[12]).toEqual({ year: 2027, month: 6 });
    expect(window).toEqual({ start: "2026-06-01", end: "2027-06-30" });
  });
});

describe("buildCalendarCells", () => {
  it("2026년 6월 달력 셀을 생성한다", () => {
    const cells = buildCalendarCells(2026, 6);
    const filled = cells.filter((cell) => cell.day != null);

    expect(filled).toHaveLength(30);
    expect(filled[0]).toEqual({ date: "2026-06-01", day: 1 });
    expect(filled[29]).toEqual({ date: "2026-06-30", day: 30 });
  });

  it("일정을 날짜별로 그룹화한다", () => {
    const grouped = groupEventsByDate([
      { id: "1", eventDate: "2026-06-10", title: "A" },
      { id: "2", eventDate: "2026-06-10", title: "B" },
      { id: "3", eventDate: "2026-06-01", title: "C" },
    ]);

    expect(grouped.get("2026-06-10")).toHaveLength(2);
    expect(grouped.get("2026-06-01")).toHaveLength(1);
  });

  it("연·월 이동을 계산한다", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});

describe("tax schedule prompt context", () => {
  const sampleEvents: TaxScheduleEvent[] = [
    {
      id: "1",
      eventDate: "2026-06-10",
      title: "부가가치세 확정신고 납부",
      note: "1기 확정",
      taxCategories: ["VAT"],
    },
    {
      id: "2",
      eventDate: "2026-06-10",
      title: "원천세 신고 납부기한",
      note: null,
      taxCategories: ["WITHHOLDING_TAX"],
    },
    {
      id: "3",
      eventDate: "2026-06-25",
      title: "법인세 중간예납",
      note: null,
      taxCategories: ["CORPORATE_TAX"],
    },
  ];

  it("세목별 일정을 필터링한다", () => {
    const filtered = filterTaxScheduleEventsForPrompt(sampleEvents, ["VAT"]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toContain("부가가치세");
  });

  it("일정 블록을 프롬프트용 텍스트로 포맷한다", () => {
    const block = formatTaxSchedulePromptBlock(sampleEvents.slice(0, 1));
    expect(block).toContain("참고: 국세청 세무일정");
    expect(block).toContain("2026-06-10: 부가가치세 확정신고 납부 (1기 확정)");
    expect(block).toContain("임의로 날짜·기한을 만들지 말고");
  });

  it("KST 기준 날짜 오프셋을 계산한다", () => {
    const now = new Date("2026-06-15T00:00:00+09:00");
    expect(getKstIsoDate(now)).toBe("2026-06-15");
    expect(addKstDays(10, now)).toBe("2026-06-25");
  });
});
