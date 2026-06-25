import type { TaxType } from "@/lib/constants";

type ClassificationRule = {
  taxType: TaxType;
  keywords: string[];
};

const CLASSIFICATION_RULES: ClassificationRule[] = [
  { taxType: "VAT", keywords: ["부가가치세", "부가세"] },
  { taxType: "INCOME_TAX", keywords: ["종합소득세", "성실신고", "분리과세"] },
  { taxType: "CORPORATE_TAX", keywords: ["법인세", "법인 지방소득세"] },
  { taxType: "WITHHOLDING_TAX", keywords: ["원천세", "원천징수"] },
  {
    taxType: "YEAR_END_SETTLEMENT",
    keywords: ["연말정산", "근로소득", "퇴직소득", "사업소득 연말정산"],
  },
];

export function classifyTaxScheduleEvent(
  title: string,
  note?: string | null,
): TaxType[] {
  const text = `${title} ${note ?? ""}`;
  const matched = new Set<TaxType>();

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      matched.add(rule.taxType);
    }
  }

  return [...matched];
}

export function detectTaxTypesInText(text: string): TaxType[] {
  const matched = new Set<TaxType>();

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      matched.add(rule.taxType);
    }
  }

  return [...matched];
}
