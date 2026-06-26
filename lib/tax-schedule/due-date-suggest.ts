import type { TaxType } from "@/lib/constants";

import { classifyTaxScheduleEvent } from "@/lib/tax-schedule/classify";
import { filterTaxScheduleEventsForPrompt } from "@/lib/tax-schedule/prompt-context";
import type { TaxScheduleEvent } from "@/lib/tax-schedule/types";
import { getKstIsoDate } from "@/lib/tax-schedule/window";

const PAYMENT_KEYWORDS = ["납부", "납부기한", "예납"] as const;

export type DueDateSuggestion = {
  dueDate: string;
  dueDateLabel: string;
  eventTitle: string;
  eventNote: string | null;
};

export function isPaymentDueEvent(title: string, note?: string | null): boolean {
  const text = `${title} ${note ?? ""}`;
  return PAYMENT_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function formatKoreanDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${year}년 ${month}월 ${day}일`;
}

function eventMatchesTaxType(event: TaxScheduleEvent, taxType: TaxType): boolean {
  if (event.taxCategories.includes(taxType)) {
    return true;
  }
  return classifyTaxScheduleEvent(event.title, event.note).includes(taxType);
}

export function suggestPaymentDueDate(
  events: TaxScheduleEvent[],
  taxType: TaxType,
  fromDate?: string,
): DueDateSuggestion | null {
  const today = fromDate ?? getKstIsoDate();

  const candidates = filterTaxScheduleEventsForPrompt(events, [taxType])
    .filter(
      (event) =>
        event.eventDate >= today &&
        isPaymentDueEvent(event.title, event.note) &&
        eventMatchesTaxType(event, taxType),
    )
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  const event = candidates[0];
  if (!event) {
    return null;
  }

  return {
    dueDate: event.eventDate,
    dueDateLabel: formatKoreanDateLabel(event.eventDate),
    eventTitle: event.title,
    eventNote: event.note,
  };
}
