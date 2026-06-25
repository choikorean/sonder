"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TAX_TYPE_LABELS, type TaxType } from "@/lib/constants";
import {
  buildCalendarCells,
  formatScheduleDate,
  formatScheduleMonthLabel,
  getWeekdayLabels,
  groupEventsByDate,
  shiftMonth,
} from "@/lib/tax-schedule/calendar";
import type { TaxScheduleEvent, TaxScheduleSyncMeta } from "@/lib/tax-schedule/types";
import { cn } from "@/lib/utils";

const NTS_SCHEDULE_URL =
  "https://www.nts.go.kr/nts/ad/taxSchdul/selectList.do";

type TaxScheduleViewProps = {
  initialYear: number;
  initialMonth: number;
  initialEvents: TaxScheduleEvent[];
  initialTaxCategory: TaxType | null;
  syncMeta: TaxScheduleSyncMeta | null;
};

type ApiSuccess = {
  success: true;
  data: {
    year: number;
    month: number;
    taxCategory: TaxType | null;
    events: TaxScheduleEvent[];
    syncMeta: TaxScheduleSyncMeta | null;
  };
};

type ApiError = {
  success: false;
  error: string;
};

function taxCategoryLabel(value: string) {
  return TAX_TYPE_LABELS[value as TaxType] ?? value;
}

export function TaxScheduleView({
  initialYear,
  initialMonth,
  initialEvents,
  initialTaxCategory,
  syncMeta,
}: TaxScheduleViewProps) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [events, setEvents] = useState(initialEvents);
  const [taxCategory, setTaxCategory] = useState<TaxType | "">(
    initialTaxCategory ?? "",
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);
  const calendarCells = useMemo(
    () => buildCalendarCells(year, month),
    [year, month],
  );
  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  function updateRoute(nextYear: number, nextMonth: number, nextCategory: TaxType | "") {
    const params = new URLSearchParams({
      year: String(nextYear),
      month: String(nextMonth),
    });
    if (nextCategory) {
      params.set("taxCategory", nextCategory);
    }
    router.replace(`/schedule?${params.toString()}`);
  }

  function loadMonth(
    nextYear: number,
    nextMonth: number,
    nextCategory: TaxType | "" = taxCategory,
  ) {
    startTransition(async () => {
      setError(null);
      const params = new URLSearchParams({
        year: String(nextYear),
        month: String(nextMonth),
      });
      if (nextCategory) {
        params.set("taxCategory", nextCategory);
      }

      try {
        const response = await fetch(`/api/tax-schedule?${params.toString()}`);
        const json = (await response.json()) as ApiSuccess | ApiError;

        if (!json.success) {
          setError(json.error);
          return;
        }

        setYear(json.data.year);
        setMonth(json.data.month);
        setEvents(json.data.events);
        setSelectedDate(null);
        updateRoute(nextYear, nextMonth, nextCategory);
      } catch {
        setError("세무일정을 불러오지 못했습니다.");
      }
    });
  }

  function handleMonthShift(delta: number) {
    const next = shiftMonth(year, month, delta);
    loadMonth(next.year, next.month);
  }

  function handleTaxCategoryChange(value: string) {
    const nextCategory = value as TaxType | "";
    setTaxCategory(nextCategory);
    loadMonth(year, month, nextCategory);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">세무일정</h1>
          <p className="text-sm text-muted-foreground">
            국세청 공식 세무일정을 월별로 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="tax-category-filter">
            세목 필터
          </label>
          <select
            id="tax-category-filter"
            value={taxCategory}
            onChange={(event) => handleTaxCategoryChange(event.target.value)}
            disabled={isPending}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">전체 세목</option>
            {(Object.keys(TAX_TYPE_LABELS) as TaxType[]).map((key) => (
              <option key={key} value={key}>
                {TAX_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {syncMeta && (
        <p className="text-xs text-muted-foreground">
          마지막 동기화:{" "}
          {new Date(syncMeta.lastSyncedAt).toLocaleString("ko-KR")} · 제공
          범위 {syncMeta.windowStart} ~ {syncMeta.windowEnd}
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-lg">
            {formatScheduleMonthLabel(year, month)}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleMonthShift(-1)}
              disabled={isPending}
              aria-label="이전 달"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date();
                loadMonth(today.getFullYear(), today.getMonth() + 1);
              }}
              disabled={isPending}
            >
              오늘
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleMonthShift(1)}
              disabled={isPending}
              aria-label="다음 달"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="이 달에 표시할 일정이 없습니다"
              description="동기화가 아직 되지 않았거나, 선택한 세목에 해당하는 일정이 없습니다."
              action={
                <a
                  href={NTS_SCHEDULE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  국세청 원본 보기
                  <ExternalLink className="size-3.5" />
                </a>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
                {getWeekdayLabels().map((label) => (
                  <div key={label} className="py-1 font-medium">
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, index) => {
                  if (!cell.date || !cell.day) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-16 rounded-md bg-muted/20"
                        aria-hidden
                      />
                    );
                  }

                  const dayEvents = eventsByDate.get(cell.date) ?? [];
                  const isSelected = selectedDate === cell.date;

                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => setSelectedDate(cell.date)}
                      className={cn(
                        "min-h-16 rounded-md border border-transparent p-1.5 text-left transition-colors hover:bg-muted/50",
                        isSelected && "border-ring bg-muted/60",
                        dayEvents.length > 0 && "bg-muted/30",
                      )}
                    >
                      <span className="text-xs font-medium">{cell.day}</span>
                      {dayEvents.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 2).map((event) => (
                            <p
                              key={event.id}
                              className="truncate text-[10px] leading-tight text-muted-foreground"
                            >
                              {event.title}
                            </p>
                          ))}
                          {dayEvents.length > 2 && (
                            <p className="text-[10px] text-muted-foreground">
                              +{dayEvents.length - 2}
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {selectedDate ? `${formatScheduleDate(selectedDate)} 일정` : "월별 목록"}
          </h2>
          <a
            href={NTS_SCHEDULE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            국세청 원본
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        <Card>
          <ul className="divide-y divide-border">
            {(selectedDate ? selectedEvents : events).map((event) => (
              <li key={event.id} className="px-4 py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    {event.note && (
                      <p className="text-sm text-muted-foreground">{event.note}</p>
                    )}
                    {event.taxCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {event.taxCategories.map((category) => (
                          <span
                            key={`${event.id}-${category}`}
                            className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {taxCategoryLabel(category)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatScheduleDate(event.eventDate)}
                  </span>
                </div>
              </li>
            ))}
            {(selectedDate ? selectedEvents : events).length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                표시할 일정이 없습니다.
              </li>
            )}
          </ul>
        </Card>
      </section>

      <p className="text-xs text-muted-foreground">
        일정은 국세청 게시 자료를 기준으로 제공되며, 최종 확인은{" "}
        <Link
          href="https://www.nts.go.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline"
        >
          국세청 홈페이지
        </Link>
        를 참고해 주세요.
      </p>
    </div>
  );
}
