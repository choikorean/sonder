const KST_TIMEZONE = "Asia/Seoul";
export const SYNC_MONTH_COUNT = 13;

export function getKstYearMonth(now = new Date()): { year: number; month: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);

  if (!year || !month) {
    throw new Error("KST 기준 연·월을 계산할 수 없습니다.");
  }

  return { year, month };
}

export function iterSyncMonths(
  startYear: number,
  startMonth: number,
  count = SYNC_MONTH_COUNT,
): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = [];
  let year = startYear;
  let month = startMonth;

  for (let index = 0; index < count; index += 1) {
    months.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

export function getWindowDateRange(
  startYear: number,
  startMonth: number,
  monthCount = SYNC_MONTH_COUNT,
): { start: string; end: string } {
  const start = `${startYear}-${String(startMonth).padStart(2, "0")}-01`;

  const endMonthIndex = startMonth + monthCount - 1;
  const endYear = startYear + Math.floor((endMonthIndex - 1) / 12);
  const endMonth = ((endMonthIndex - 1) % 12) + 1;
  const lastDay = new Date(endYear, endMonth, 0).getDate();
  const end = `${endYear}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  return { start, end };
}

export function getKstIsoDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addKstDays(days: number, now = new Date()): string {
  const [year, month, day] = getKstIsoDate(now).split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 3, 0, 0));

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shifted);
}
