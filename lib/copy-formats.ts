import type { HistoryData } from "@/lib/history";
import { TAX_TYPE_LABELS, type TaxType } from "@/lib/constants";
import { toPlainClientText } from "@/lib/plain-text";

function taxLabel(value: string) {
  return TAX_TYPE_LABELS[value as TaxType] ?? value;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Team 플랜: 대표 검토용 생성 내역 정리 */
export function buildReviewSummary(
  history: HistoryData,
  authorName?: string | null,
): string {
  const lines: string[] = [
    "[TaxFlo 대표 검토용 생성 내역 정리]",
    `작성 시각: ${new Date().toLocaleString("ko-KR")}`,
  ];
  if (authorName?.trim()) {
    lines.push(`작성자: ${authorName.trim()}`);
  }
  lines.push("", "■ 자료 요청문");
  if (history.requests.length === 0) {
    lines.push("- (없음)");
  } else {
    for (const item of history.requests.slice(0, 10)) {
      const authorSuffix = item.authorName ? ` · ${item.authorName}` : "";
      lines.push(
        `- ${formatDate(item.createdAt)}${authorSuffix} · ${taxLabel(item.taxType)} · ${item.result.slice(0, 120).replace(/\n/g, " ")}…`,
      );
    }
  }

  lines.push("", "■ 상담 요약");
  if (history.consultations.length === 0) {
    lines.push("- (없음)");
  } else {
    for (const item of history.consultations.slice(0, 10)) {
      const authorSuffix = item.authorName ? ` · ${item.authorName}` : "";
      lines.push(
        `- ${formatDate(item.createdAt)}${authorSuffix} · ${item.summary.slice(0, 120).replace(/\n/g, " ")}…`,
      );
    }
  }

  lines.push("", "■ 신고 결과 설명문");
  if (history.reports.length === 0) {
    lines.push("- (없음)");
  } else {
    for (const item of history.reports.slice(0, 10)) {
      const authorSuffix = item.authorName ? ` · ${item.authorName}` : "";
      lines.push(
        `- ${formatDate(item.createdAt)}${authorSuffix} · ${taxLabel(item.taxType)} · ${item.result.slice(0, 120).replace(/\n/g, " ")}…`,
      );
    }
  }

  lines.push("", "※ AI가 생성한 초안입니다. 발송 전 세무사가 반드시 검토해야 합니다.");
  return lines.join("\n");
}

export function formatForKakao(text: string): string {
  return toPlainClientText(text);
}

export function formatForEmail(text: string, subject = "안내드립니다"): string {
  return `제목: ${subject}\n\n${toPlainClientText(text)}`;
}

export function retentionCutoffIso(retentionDays: number): string | null {
  if (retentionDays <= 0) return null;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - retentionDays);
  return d.toISOString();
}
