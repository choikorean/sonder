"use client";

import { CopyButton } from "@/components/copy-button";
import { ReviewDisclaimer } from "@/components/review-disclaimer";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReportExplanationSections } from "@/lib/report-explanation/output";
import { toPlainClientText } from "@/lib/plain-text";

function SectionCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  const content = toPlainClientText(value.trim());
  if (!content || content === "해당 없음") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardAction>
          <CopyButton text={content} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </p>
      </CardContent>
    </Card>
  );
}

export function ReportExplanationOutput({
  result,
  sections,
}: {
  result: string;
  sections: ReportExplanationSections;
}) {
  const plainResult = toPlainClientText(result);

  return (
    <div className="space-y-4">
      <SectionCard title="금액 요약" value={sections.amountSummary} />
      <SectionCard title="변동 사유" value={sections.changeExplanation} />
      <SectionCard title="납부 안내" value={sections.paymentGuidance} />

      <Card>
        <CardHeader>
          <CardTitle>전체 설명문</CardTitle>
          <CardAction>
            <CopyButton text={plainResult} />
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {plainResult}
          </div>
          <ReviewDisclaimer />
        </CardContent>
      </Card>
    </div>
  );
}
