import { TAX_TYPE_LABELS, type TaxType } from "@/lib/constants";
import { getDocumentRequestDates } from "@/lib/document-request-dates";

export type SeasonPreset = {
  id: string;
  label: string;
  taxType: TaxType;
  titleSuffix: string;
  defaultMemo: string;
  submissionDays: number;
};

export const SEASON_PRESETS: SeasonPreset[] = [
  {
    id: "vat_h1_provisional",
    label: "부가세 1기 예정",
    taxType: "VAT",
    titleSuffix: "1기 예정 부가세",
    defaultMemo: "1기 예정 신고에 필요한 자료를 요청드립니다.",
    submissionDays: 14,
  },
  {
    id: "vat_h1_final",
    label: "부가세 1기 확정",
    taxType: "VAT",
    titleSuffix: "1기 확정 부가세",
    defaultMemo: "1기 확정 신고에 필요한 자료를 요청드립니다.",
    submissionDays: 14,
  },
  {
    id: "vat_h2_provisional",
    label: "부가세 2기 예정",
    taxType: "VAT",
    titleSuffix: "2기 예정 부가세",
    defaultMemo: "2기 예정 신고에 필요한 자료를 요청드립니다.",
    submissionDays: 14,
  },
  {
    id: "vat_h2_final",
    label: "부가세 2기 확정",
    taxType: "VAT",
    titleSuffix: "2기 확정 부가세",
    defaultMemo: "2기 확정 신고에 필요한 자료를 요청드립니다.",
    submissionDays: 14,
  },
  {
    id: "income_tax",
    label: "종합소득세",
    taxType: "INCOME_TAX",
    titleSuffix: "종합소득세",
    defaultMemo: "종합소득세 신고에 필요한 자료를 요청드립니다.",
    submissionDays: 21,
  },
  {
    id: "corporate_tax",
    label: "법인세",
    taxType: "CORPORATE_TAX",
    titleSuffix: "법인세",
    defaultMemo: "법인세 신고에 필요한 자료를 요청드립니다.",
    submissionDays: 21,
  },
  {
    id: "withholding_tax",
    label: "원천세",
    taxType: "WITHHOLDING_TAX",
    titleSuffix: "원천세",
    defaultMemo: "원천세 신고·납부에 필요한 자료를 요청드립니다.",
    submissionDays: 7,
  },
  {
    id: "year_end_settlement",
    label: "연말정산",
    taxType: "YEAR_END_SETTLEMENT",
    titleSuffix: "연말정산",
    defaultMemo: "연말정산에 필요한 자료를 요청드립니다.",
    submissionDays: 14,
  },
];

export function getSeasonPreset(id: string | null | undefined): SeasonPreset | null {
  if (!id) return null;
  return SEASON_PRESETS.find((preset) => preset.id === id) ?? null;
}

function getKstYear(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  return year ? Number(year) : now.getFullYear();
}

export function buildCampaignTitleFromPreset(
  preset: SeasonPreset,
  now = new Date(),
): string {
  return `${getKstYear(now)}년 ${preset.titleSuffix} 자료 요청`;
}

export type CampaignPresetDefaults = {
  title: string;
  taxType: TaxType;
  memo: string;
  submissionDeadlineLabel: string;
  requestDateLabel: string;
  seasonPresetId: string | null;
};

export function resolveCampaignPresetDefaults(input: {
  seasonPresetId?: string | null;
  taxType?: TaxType;
  title?: string | null;
  memo?: string | null;
  now?: Date;
}): CampaignPresetDefaults {
  const preset = getSeasonPreset(input.seasonPresetId);
  const taxType = preset?.taxType ?? input.taxType ?? "VAT";
  const submissionDays = preset?.submissionDays ?? 14;
  const dates = getDocumentRequestDates(input.now, submissionDays);

  return {
    title:
      input.title?.trim() ||
      (preset
        ? buildCampaignTitleFromPreset(preset, input.now)
        : `${TAX_TYPE_LABELS[taxType]} 자료 요청`),
    taxType,
    memo: input.memo?.trim() || preset?.defaultMemo || "",
    submissionDeadlineLabel: dates.submissionDeadline,
    requestDateLabel: dates.requestDate,
    seasonPresetId: preset?.id ?? input.seasonPresetId ?? null,
  };
}
