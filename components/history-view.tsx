"use client";

import { useState } from "react";
import { Inbox, Mic } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyFormatActions } from "@/components/copy-format-actions";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TAX_TYPE_LABELS,
  BUSINESS_TYPE_LABELS,
  type TaxType,
  type BusinessType,
} from "@/lib/constants";
import type { HistoryData } from "@/lib/history";
import { toPlainClientText } from "@/lib/plain-text";

type TabKey = "requests" | "consultations" | "reports";

function taxLabel(value: string) {
  return TAX_TYPE_LABELS[value as TaxType] ?? value;
}

function businessLabel(value: string) {
  return BUSINESS_TYPE_LABELS[value as BusinessType] ?? value;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Section({
  title,
  value,
  copyFormats = false,
  emailSubject,
}: {
  title: string;
  value: string | null;
  copyFormats?: boolean;
  emailSubject?: string;
}) {
  const content = toPlainClientText(value?.trim() ?? "");
  if (!content) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <CopyFormatActions
          text={content}
          copyFormats={copyFormats}
          emailSubject={emailSubject}
        />
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {content}
      </p>
    </div>
  );
}

export function HistoryView({
  data,
  retentionDays,
  reviewSummary,
  copyFormats,
  fullConsultationOutput,
}: {
  data: HistoryData;
  retentionDays: number;
  reviewSummary: boolean;
  copyFormats: boolean;
  fullConsultationOutput: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("requests");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewText, setReviewText] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  async function loadReviewSummary() {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/history/review");
      const json = await res.json();
      if (!json.success) {
        setReviewError(json.error);
        return;
      }
      setReviewText(json.data.summary);
    } catch {
      setReviewError("검토용 정리를 불러오지 못했습니다.");
    } finally {
      setReviewLoading(false);
    }
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "requests", label: "자료 요청", count: data.requests.length },
    { key: "consultations", label: "상담 요약", count: data.consultations.length },
    { key: "reports", label: "설명문", count: data.reports.length },
  ];

  return (
    <div className="space-y-5">
      {retentionDays > 0 && (
        <p className="text-sm text-muted-foreground">
          최근 {retentionDays}일 이내 생성 내역만 표시됩니다.
        </p>
      )}

      {reviewSummary && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">대표 검토용 생성 내역 정리</p>
            <p className="text-sm text-muted-foreground">
              최근 생성 결과를 한 문서로 모아 검토할 수 있습니다.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={loadReviewSummary}
            disabled={reviewLoading}
          >
            {reviewLoading ? "생성 중..." : "검토용 정리 생성"}
          </Button>
        </div>
      )}

      {reviewError && (
        <p className="text-sm text-destructive" role="alert">
          {reviewError}
        </p>
      )}

      {reviewText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">대표 검토용 정리</CardTitle>
            <CardAction>
              <CopyFormatActions
                text={reviewText}
                copyFormats={copyFormats}
                emailSubject="생성 내역 검토"
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {reviewText}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm transition-colors",
              tab === t.key
                ? "bg-background font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-muted-foreground">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === "requests" && (
        <div className="space-y-4">
          {data.requests.length === 0 ? (
            <EmptyState icon={Inbox} title="자료 요청 내역이 없습니다" />
          ) : (
            data.requests.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {taxLabel(item.taxType)} · {businessLabel(item.businessType)}
                  </CardTitle>
                  <CardAction>
                    <CopyFormatActions
                      text={toPlainClientText(item.result)}
                      copyFormats={copyFormats}
                      emailSubject="자료 요청 안내"
                    />
                  </CardAction>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                    {item.authorName ? ` · ${item.authorName}` : ""}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {item.memo && (
                    <p className="text-xs text-muted-foreground">
                      특이사항: {item.memo}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {toPlainClientText(item.result)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "consultations" && (
        <div className="space-y-4">
          {data.consultations.length === 0 ? (
            <EmptyState icon={Inbox} title="상담 요약 내역이 없습니다" />
          ) : (
            data.consultations.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    상담 요약
                    {item.hasAudio && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                        <Mic className="size-3" />
                        음성
                      </span>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                    {item.authorName ? ` · ${item.authorName}` : ""}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Section title="상담 요약" value={item.summary} />
                  {fullConsultationOutput ? (
                    <>
                      <Section
                        title="고객 전달용 정리문"
                        value={item.clientSummary}
                        copyFormats={copyFormats}
                        emailSubject="상담 내용 정리"
                      />
                      <Section
                        title="추가로 받아야 할 자료"
                        value={item.requiredDocuments}
                        copyFormats={copyFormats}
                        emailSubject="추가 자료 요청"
                      />
                      <Section title="내부 후속 조치" value={item.nextActions} />
                      <Section
                        title="다음 안내 사항"
                        value={item.nextGuidance}
                        copyFormats={copyFormats}
                        emailSubject="다음 안내"
                      />
                    </>
                  ) : (
                    <Section title="내부 후속 조치" value={item.nextActions} />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-4">
          {data.reports.length === 0 ? (
            <EmptyState icon={Inbox} title="설명문 내역이 없습니다" />
          ) : (
            data.reports.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {taxLabel(item.taxType)} 설명문
                  </CardTitle>
                  <CardAction>
                    <CopyFormatActions
                      text={toPlainClientText(item.result)}
                      copyFormats={copyFormats}
                      emailSubject="신고 결과 안내"
                    />
                  </CardAction>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                    {item.authorName ? ` · ${item.authorName}` : ""}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    이번 세액: {item.currentTax.toLocaleString()}원
                    {item.previousTax != null &&
                      ` · 이전 세액: ${item.previousTax.toLocaleString()}원`}
                    {item.changeReason && ` · 변동 사유: ${item.changeReason}`}
                    {item.dueDate && ` · 납부기한: ${item.dueDate}`}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {toPlainClientText(item.result)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
