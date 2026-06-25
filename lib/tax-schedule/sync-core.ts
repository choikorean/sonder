import type { SupabaseClient } from "@supabase/supabase-js";

import { classifyTaxScheduleEvent } from "@/lib/tax-schedule/classify";
import {
  fetchNtsTaxScheduleMonth,
  parseNtsTaxScheduleHtml,
} from "@/lib/tax-schedule/nts-parser";
import type { TaxScheduleSyncResult } from "@/lib/tax-schedule/types";
import {
  getKstYearMonth,
  getWindowDateRange,
  iterSyncMonths,
  SYNC_MONTH_COUNT,
} from "@/lib/tax-schedule/window";
import type { Database } from "@/types/database";

const SYNC_FETCH_DELAY_MS = 500;

type AppSupabase = SupabaseClient<Database>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type SyncTaxScheduleOptions = {
  dryRun?: boolean;
  now?: Date;
};

export async function syncTaxScheduleWithClient(
  supabase: AppSupabase,
  options: SyncTaxScheduleOptions = {},
): Promise<TaxScheduleSyncResult> {
  const { year, month } = getKstYearMonth(options.now);
  const months = iterSyncMonths(year, month, SYNC_MONTH_COUNT);
  const window = getWindowDateRange(year, month, SYNC_MONTH_COUNT);

  let runId: string | null = null;

  if (!options.dryRun) {
    const { data: run, error: runError } = await supabase
      .from("tax_schedule_sync_runs")
      .insert({
        status: "running",
        window_start: window.start,
        window_end: window.end,
      })
      .select("id")
      .single();

    if (runError) {
      throw new Error(`동기화 실행 기록 생성 실패: ${runError.message}`);
    }

    runId = run.id;
  }

  let eventsUpserted = 0;
  let monthsSucceeded = 0;
  const errors: TaxScheduleSyncResult["errors"] = [];

  for (let index = 0; index < months.length; index += 1) {
    const { year: sourceYear, month: sourceMonth } = months[index]!;

    if (index > 0) {
      await sleep(SYNC_FETCH_DELAY_MS);
    }

    try {
      const html = await fetchNtsTaxScheduleMonth(sourceYear, sourceMonth);
      const parsed = parseNtsTaxScheduleHtml(html, sourceYear, sourceMonth);

      if (parsed.length === 0) {
        monthsSucceeded += 1;
        continue;
      }

      if (!options.dryRun) {
        const { error: deleteError } = await supabase
          .from("tax_schedule_events")
          .delete()
          .eq("source_year", sourceYear)
          .eq("source_month", sourceMonth);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        const rows = parsed.map((event) => ({
          event_date: event.eventDate,
          title: event.title,
          note: event.note,
          tax_categories: classifyTaxScheduleEvent(event.title, event.note),
          source_year: sourceYear,
          source_month: sourceMonth,
          source_url: event.sourceUrl,
          content_hash: event.contentHash,
          updated_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from("tax_schedule_events")
          .insert(rows);

        if (insertError) {
          throw new Error(insertError.message);
        }

        eventsUpserted += rows.length;
      }

      monthsSucceeded += 1;
    } catch (error) {
      errors.push({
        year: sourceYear,
        month: sourceMonth,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  let eventsDeleted = 0;
  const success = errors.length === 0;

  if (!options.dryRun && success) {
    const { data: deletedRows, error: pruneError } = await supabase
      .from("tax_schedule_events")
      .delete()
      .or(`event_date.lt.${window.start},event_date.gt.${window.end}`)
      .select("id");

    if (pruneError) {
      errors.push({
        year,
        month,
        message: `윈도우 밖 일정 삭제 실패: ${pruneError.message}`,
      });
    } else {
      eventsDeleted = deletedRows?.length ?? 0;
    }
  }

  const finalSuccess = errors.length === 0;

  if (!options.dryRun && runId) {
    await supabase
      .from("tax_schedule_sync_runs")
      .update({
        status: finalSuccess ? "success" : "failed",
        months_processed: monthsSucceeded,
        events_upserted: eventsUpserted,
        events_deleted: eventsDeleted,
        error_message:
          errors.length > 0 ? JSON.stringify(errors, null, 2) : null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);
  }

  return {
    success: finalSuccess,
    monthsProcessed: months.length,
    monthsSucceeded,
    eventsUpserted,
    eventsDeleted,
    windowStart: window.start,
    windowEnd: window.end,
    errors,
    runId,
  };
}
