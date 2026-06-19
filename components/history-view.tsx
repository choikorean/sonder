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
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import {
  TAX_TYPE_LABELS,
  BUSINESS_TYPE_LABELS,
  type TaxType,
  type BusinessType,
} from "@/lib/constants";
import type { HistoryData } from "@/lib/history";

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

function Section({ title, value }: { title: string; value: string | null }) {
  const content = value?.trim();
  if (!content) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <CopyButton text={content} />
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

export function HistoryView({ data }: { data: HistoryData }) {
  const [tab, setTab] = useState<TabKey>("requests");

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "requests", label: "자료 요청", count: data.requests.length },
    { key: "consultations", label: "상담 요약", count: data.consultations.length },
    { key: "reports", label: "설명문", count: data.reports.length },
  ];

  return (
    <div className="space-y-5">
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
                    <CopyButton text={item.result} />
                  </CardAction>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {item.memo && (
                    <p className="text-xs text-muted-foreground">
                      특이사항: {item.memo}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {item.result}
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
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Section title="내부 요약" value={item.summary} />
                  <Section title="고객 전달용 요약" value={item.clientSummary} />
                  <Section title="필요 자료" value={item.requiredDocuments} />
                  <Section title="후속 조치" value={item.nextActions} />
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
                    <CopyButton text={item.result} />
                  </CardAction>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    이번 세액: {item.currentTax.toLocaleString()}원
                    {item.previousTax != null &&
                      ` · 이전 세액: ${item.previousTax.toLocaleString()}원`}
                    {item.changeReason && ` · 변동 사유: ${item.changeReason}`}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {item.result}
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
