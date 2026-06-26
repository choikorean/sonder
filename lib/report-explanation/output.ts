import { toPlainClientText } from "@/lib/plain-text";

export type ReportExplanationSections = {
  amountSummary: string;
  changeExplanation: string;
  paymentGuidance: string;
};

export function parseReportExplanationJson(
  raw: Record<string, unknown>,
): ReportExplanationSections {
  return {
    amountSummary: toPlainClientText(String(raw.amountSummary ?? "").trim()),
    changeExplanation: toPlainClientText(
      String(raw.changeExplanation ?? "").trim(),
    ),
    paymentGuidance: toPlainClientText(
      String(raw.paymentGuidance ?? "").trim(),
    ),
  };
}

export function assertReportExplanationSections(
  sections: ReportExplanationSections,
): void {
  if (!sections.amountSummary) {
    throw new Error("빈 응답");
  }
}

export function combineReportExplanationSections(
  sections: ReportExplanationSections,
): string {
  const parts = [sections.amountSummary];

  if (
    sections.changeExplanation &&
    sections.changeExplanation !== "해당 없음"
  ) {
    parts.push(sections.changeExplanation);
  }

  if (sections.paymentGuidance) {
    parts.push(sections.paymentGuidance);
  }

  return parts.join("\n\n");
}
