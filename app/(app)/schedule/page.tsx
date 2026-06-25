import { createClient } from "@/lib/supabase/server";
import {
  getTaxScheduleEventsForMonth,
  getTaxScheduleSyncMeta,
} from "@/lib/tax-schedule/queries";
import { getKstYearMonth } from "@/lib/tax-schedule/window";
import { TaxScheduleView } from "@/components/tax-schedule/tax-schedule-view";
import type { TaxType } from "@/lib/constants";

export const metadata = {
  title: "세무일정",
};

const TAX_TYPES = new Set<string>([
  "VAT",
  "INCOME_TAX",
  "CORPORATE_TAX",
  "WITHHOLDING_TAX",
  "YEAR_END_SETTLEMENT",
]);

function parseYearMonth(
  params: { year?: string; month?: string },
  fallback: { year: number; month: number },
) {
  const year = Number(params.year);
  const month = Number(params.month);

  return {
    year:
      Number.isInteger(year) && year >= 2000 && year <= 2100
        ? year
        : fallback.year,
    month:
      Number.isInteger(month) && month >= 1 && month <= 12
        ? month
        : fallback.month,
  };
}

function parseTaxCategory(value?: string): TaxType | null {
  if (!value || !TAX_TYPES.has(value)) {
    return null;
  }
  return value as TaxType;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; taxCategory?: string }>;
}) {
  const params = await searchParams;
  const fallback = getKstYearMonth();
  const { year, month } = parseYearMonth(params, fallback);
  const taxCategory = parseTaxCategory(params.taxCategory);

  const supabase = await createClient();
  const [events, syncMeta] = await Promise.all([
    getTaxScheduleEventsForMonth(supabase, year, month, taxCategory ?? undefined),
    getTaxScheduleSyncMeta(supabase),
  ]);

  return (
    <TaxScheduleView
      initialYear={year}
      initialMonth={month}
      initialEvents={events}
      initialTaxCategory={taxCategory}
      syncMeta={syncMeta}
    />
  );
}
