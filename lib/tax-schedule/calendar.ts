export type CalendarCell = {
  date: string | null;
  day: number | null;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function getWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}

export function buildCalendarCells(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ date: null, day: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
    });
  }

  return cells;
}

export function formatScheduleMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });
}

export function formatScheduleDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

export function groupEventsByDate<T extends { eventDate: string }>(
  events: T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const event of events) {
    const existing = grouped.get(event.eventDate) ?? [];
    existing.push(event);
    grouped.set(event.eventDate, existing);
  }

  return grouped;
}
