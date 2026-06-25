import type { SupabaseClient } from "@supabase/supabase-js";

import type { TaxType } from "@/lib/constants";
import type { Database } from "@/types/database";

import { getKstYearMonth, getWindowDateRange } from "./window";
import type { TaxScheduleEvent, TaxScheduleSyncMeta } from "./types";

type AppSupabase = SupabaseClient<Database>;

function getKstDateString(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  return getWindowDateRange(year, month, 1);
}

type TaxScheduleEventRow = Pick<
  Database["public"]["Tables"]["tax_schedule_events"]["Row"],
  "id" | "event_date" | "title" | "note" | "tax_categories"
>;

function mapTaxScheduleRow(row: TaxScheduleEventRow): TaxScheduleEvent {
  return {
    id: row.id,
    eventDate: row.event_date,
    title: row.title,
    note: row.note,
    taxCategories: row.tax_categories,
  };
}

export async function getTaxScheduleEventsForMonth(
  supabase: AppSupabase,
  year: number,
  month: number,
  taxCategory?: TaxType,
): Promise<TaxScheduleEvent[]> {
  const { start, end } = getMonthDateRange(year, month);

  let query = supabase
    .from("tax_schedule_events")
    .select("id, event_date, title, note, tax_categories")
    .gte("event_date", start)
    .lte("event_date", end)
    .order("event_date", { ascending: true })
    .order("title", { ascending: true });

  if (taxCategory) {
    query = query.contains("tax_categories", [taxCategory]);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapTaxScheduleRow);
}

export async function getUpcomingTaxScheduleEvents(
  supabase: AppSupabase,
  limit = 5,
): Promise<TaxScheduleEvent[]> {
  const today = getKstDateString();
  const { year, month } = getKstYearMonth();
  const { end } = getMonthDateRange(year, month);

  const { data, error } = await supabase
    .from("tax_schedule_events")
    .select("id, event_date, title, note, tax_categories")
    .gte("event_date", today)
    .lte("event_date", end)
    .order("event_date", { ascending: true })
    .order("title", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapTaxScheduleRow);
}

export async function getTaxScheduleSyncMeta(
  supabase: AppSupabase,
): Promise<TaxScheduleSyncMeta | null> {
  const { data, error } = await supabase
    .from("tax_schedule_sync_runs")
    .select("finished_at, window_start, window_end, status")
    .eq("status", "success")
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.finished_at) {
    return null;
  }

  return {
    lastSyncedAt: data.finished_at,
    windowStart: data.window_start,
    windowEnd: data.window_end,
  };
}

export async function getTaxScheduleEventsInRange(
  supabase: AppSupabase,
  startDate: string,
  endDate: string,
  limit = 50,
): Promise<TaxScheduleEvent[]> {
  const { data, error } = await supabase
    .from("tax_schedule_events")
    .select("id, event_date, title, note, tax_categories")
    .gte("event_date", startDate)
    .lte("event_date", endDate)
    .order("event_date", { ascending: true })
    .order("title", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapTaxScheduleRow);
}
