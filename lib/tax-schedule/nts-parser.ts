import * as cheerio from "cheerio";

import { buildContentHash } from "@/lib/tax-schedule/hash";
import type { ParsedTaxScheduleEvent } from "@/lib/tax-schedule/types";

const NTS_SCHEDULE_BASE_URL =
  "https://www.nts.go.kr/nts/ad/taxSchdul/selectList.do";

export function buildNtsScheduleUrl(taxYear: number, taxMonth: number): string {
  const month = String(taxMonth).padStart(2, "0");
  return `${NTS_SCHEDULE_BASE_URL}?taxYear=${taxYear}&taxMonth=${month}&mi=135747`;
}

export async function fetchNtsTaxScheduleMonth(
  taxYear: number,
  taxMonth: number,
): Promise<string> {
  const url = buildNtsScheduleUrl(taxYear, taxMonth);
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9",
      "User-Agent": "TaxFlow/1.0 (+https://taxflo.vercel.app)",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`국세청 일정 페이지 조회 실패 (HTTP ${response.status})`);
  }

  return response.text();
}

function normalizeCellText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function findColumnIndex(headers: string[], matchers: string[]): number {
  return headers.findIndex((header) =>
    matchers.some((matcher) => header.includes(matcher)),
  );
}

function parseDayValue(value: string): number | null {
  const match = value.match(/\d{1,2}/);
  if (!match) return null;
  const day = Number.parseInt(match[0], 10);
  return Number.isFinite(day) && day >= 1 && day <= 31 ? day : null;
}

function parseMonthValue(value: string, fallbackMonth: number): number {
  const match = value.match(/\d{1,2}/);
  if (!match) return fallbackMonth;
  const month = Number.parseInt(match[0], 10);
  return month >= 1 && month <= 12 ? month : fallbackMonth;
}

export function parseNtsTaxScheduleHtml(
  html: string,
  taxYear: number,
  taxMonth: number,
): ParsedTaxScheduleEvent[] {
  const $ = cheerio.load(html);
  const sourceUrl = buildNtsScheduleUrl(taxYear, taxMonth);
  const events: ParsedTaxScheduleEvent[] = [];

  $("table").each((_, table) => {
    const headerCells = $(table)
      .find("thead tr")
      .first()
      .find("th, td")
      .map((__, cell) => normalizeCellText($(cell).text()))
      .get();

    const monthIndex = findColumnIndex(headerCells, ["월"]);
    const dayIndex = findColumnIndex(headerCells, ["일"]);
    const scheduleIndex = findColumnIndex(headerCells, ["일정"]);
    const noteIndex = findColumnIndex(headerCells, ["비고"]);

    if (dayIndex < 0 || scheduleIndex < 0) {
      return;
    }

    $(table)
      .find("tbody tr")
      .each((__, row) => {
        const cells = $(row)
          .find("td")
          .map((___, cell) => normalizeCellText($(cell).text()))
          .get();

        if (cells.length === 0) return;

        const title = cells[scheduleIndex] ?? "";
        if (!title) return;

        const day = parseDayValue(cells[dayIndex] ?? "");
        if (!day) return;

        const eventMonth = parseMonthValue(
          monthIndex >= 0 ? (cells[monthIndex] ?? "") : "",
          taxMonth,
        );
        const noteRaw = noteIndex >= 0 ? (cells[noteIndex] ?? "") : "";
        const note = noteRaw.length > 0 ? noteRaw : null;
        const eventDate = `${taxYear}-${String(eventMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        events.push({
          eventDate,
          title,
          note,
          sourceUrl,
          contentHash: buildContentHash(eventDate, title, note),
        });
      });

    if (events.length > 0) {
      return false;
    }
  });

  return events;
}
