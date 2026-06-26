"use client";

import Link from "next/link";

import { buildDocumentRequestLink } from "@/lib/follow-up/links";
import { toPlainClientText } from "@/lib/plain-text";

export function ConsultationFollowUpActions({
  clientId,
  requiredDocuments,
  consultationSummary,
}: {
  clientId: string | null;
  requiredDocuments: string;
  consultationSummary: string;
}) {
  const documents = toPlainClientText(requiredDocuments.trim());
  const hasDocuments = documents && documents !== "해당 없음";
  const requestHref = buildDocumentRequestLink({
    clientId,
    requiredDocuments: hasDocuments ? documents : null,
    consultationSummary,
  });

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
      <p className="font-medium">다음 작업</p>
      <ul className="mt-2 space-y-2 text-foreground">
        <li>
          <Link
            href={requestHref}
            className="underline underline-offset-4 hover:text-foreground/80"
          >
            고객에게 보낼 자료 요청문 생성
          </Link>
          {hasDocuments ? " (추가 자료·상담 요약이 메모에 채워집니다)" : ""}
        </li>
        {hasDocuments && (
          <li>
            <Link
              href={`/requests/explain?${new URLSearchParams({
                items: documents,
                question: "홈택스에 다 있는 거 아닌가요?",
                ...(clientId ? { clientId } : {}),
              }).toString()}`}
              className="underline underline-offset-4 hover:text-foreground/80"
            >
              자료 필요 이유 설명문 생성
            </Link>
          </li>
        )}
        <li>
          <Link
            href="/follow-ups"
            className="underline underline-offset-4 hover:text-foreground/80"
          >
            후속 조치 전체 보기
          </Link>
        </li>
      </ul>
    </div>
  );
}
