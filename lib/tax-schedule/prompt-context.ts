import type { SupabaseClient } from "@supabase/supabase-js";

import type { TaxType } from "@/lib/constants";
import type { Database } from "@/types/database";

import {
  classifyTaxScheduleEvent,
  detectTaxTypesInText,
} from "@/lib/tax-schedule/classify";
import { getTaxScheduleEventsInRange } from "@/lib/tax-schedule/queries";
import type { TaxScheduleEvent } from "@/lib/tax-schedule/types";
import { addKstDays, getKstIsoDate } from "@/lib/tax-schedule/window";

const DEFAULT_WITHIN_DAYS = 45;
const MAX_PROMPT_EVENTS = 15;

type AppSupabase = SupabaseClient<Database>;

export type TaxSchedulePromptOptions = {
  taxType?: TaxType;
  taxTypes?: TaxType[];
  consultationText?: string;
  fromDate?: Date;
  withinDays?: number;
};

export function filterTaxScheduleEventsForPrompt(
  events: TaxScheduleEvent[],
  taxTypes?: TaxType[],
): TaxScheduleEvent[] {
  if (!taxTypes?.length) {
    return events;
  }

  const filtered = events.filter((event) => {
    if (event.taxCategories.some((category) => taxTypes.includes(category as TaxType))) {
      return true;
    }

    return classifyTaxScheduleEvent(event.title, event.note).some((category) =>
      taxTypes.includes(category),
    );
  });

  return filtered.length > 0 ? filtered : events;
}

export function formatTaxSchedulePromptBlock(
  events: TaxScheduleEvent[],
): string {
  if (events.length === 0) {
    return "";
  }

  const lines = events.map((event) => {
    const note = event.note ? ` (${event.note})` : "";
    return `- ${event.eventDate}: ${event.title}${note}`;
  });

  return `\n\n참고: 국세청 세무일정(공식 게시 기준, 초안 작성 참고용)
${lines.join("\n")}
※ 위 일정은 참고용입니다. 임의로 날짜·기한을 만들지 말고, 제공된 일정만 인용하세요. 생성문 본문에 출처 표기는 하지 마세요.`;
}

function resolveTaxTypes(options: TaxSchedulePromptOptions): TaxType[] | undefined {
  if (options.taxTypes?.length) {
    return options.taxTypes;
  }

  if (options.taxType) {
    return [options.taxType];
  }

  if (options.consultationText?.trim()) {
    const detected = detectTaxTypesInText(options.consultationText);
    return detected.length > 0 ? detected : undefined;
  }

  return undefined;
}

export async function getTaxSchedulePromptBlock(
  supabase: AppSupabase,
  options: TaxSchedulePromptOptions = {},
): Promise<string> {
  try {
    const withinDays = options.withinDays ?? DEFAULT_WITHIN_DAYS;
    const startDate = getKstIsoDate(options.fromDate);
    const endDate = addKstDays(withinDays, options.fromDate);

    const events = await getTaxScheduleEventsInRange(
      supabase,
      startDate,
      endDate,
      MAX_PROMPT_EVENTS * 2,
    );

    const taxTypes = resolveTaxTypes(options);
    const relevant = filterTaxScheduleEventsForPrompt(events, taxTypes).slice(
      0,
      MAX_PROMPT_EVENTS,
    );

    return formatTaxSchedulePromptBlock(relevant);
  } catch {
    return "";
  }
}
