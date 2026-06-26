"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { CopyButton } from "@/components/copy-button";
import { GeneratedOutput } from "@/components/generated-output";
import { LoadingButton } from "@/components/loading-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CAMPAIGN_ITEM_STATUSES,
  CAMPAIGN_ITEM_STATUS_LABELS,
  type CampaignItemStatus,
  type DocumentCampaignDetail,
} from "@/lib/document-campaign/types";
import { TAX_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "h-8 rounded-md border border-input bg-transparent px-2 text-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
);

type GeneratedRow = {
  itemId: string;
  clientName: string;
  result: string;
};

export function CampaignDetailClient({
  initialCampaign,
}: {
  initialCampaign: DocumentCampaignDetail;
}) {
  const router = useRouter();
  const [campaign, setCampaign] = useState(initialCampaign);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rerequestItemId, setRerequestItemId] = useState<string | null>(null);
  const [missingItems, setMissingItems] = useState("");
  const [rerequestLoading, setRerequestLoading] = useState(false);
  const [generatedRows, setGeneratedRows] = useState<GeneratedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const rerequestItem = useMemo(
    () => campaign.items.find((item) => item.id === rerequestItemId) ?? null,
    [campaign.items, rerequestItemId],
  );

  function toggleSelected(itemId: string) {
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  }

  async function refreshCampaign(next?: DocumentCampaignDetail) {
    if (next) {
      setCampaign(next);
      return;
    }
    const res = await fetch(`/api/campaigns/${campaign.id}`);
    const json = await res.json();
    if (json.success) {
      setCampaign(json.data.campaign);
    }
  }

  async function updateItemStatus(
    itemId: string,
    status: CampaignItemStatus,
    nextMissingItems?: string | null,
  ) {
    setError(null);
    const res = await fetch(`/api/campaigns/${campaign.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        missingItems: nextMissingItems ?? undefined,
      }),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error);
      return;
    }
    setCampaign(json.data.campaign);
  }

  async function handleBulkGenerate() {
    setBulkLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: selectedIds.length > 0 ? selectedIds : undefined,
          onlyNotRequested: selectedIds.length === 0,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }

      setCampaign(json.data.campaign);
      setGeneratedRows(json.data.generated ?? []);
      setMessage(
        `${json.data.generated.length}건 생성 완료` +
          (json.data.failed.length > 0
            ? ` · ${json.data.failed.length}건 실패`
            : ""),
      );
      router.refresh();
    } catch {
      setError("일괄 생성 중 오류가 발생했습니다.");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleRerequest() {
    if (!rerequestItem) return;
    setRerequestLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/request-rerequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxType: campaign.taxType,
          missingItems,
          memo: campaign.memo ?? undefined,
          clientId: rerequestItem.clientId,
          campaignItemId: rerequestItem.id,
          submissionDeadlineLabel:
            campaign.submissionDeadlineLabel ?? undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }

      setGeneratedRows([
        {
          itemId: rerequestItem.id,
          clientName: rerequestItem.clientName,
          result: json.data.result,
        },
      ]);
      setMessage(`${rerequestItem.clientName} 재요청문이 생성되었습니다.`);
      setRerequestItemId(null);
      setMissingItems("");
      await refreshCampaign();
      router.refresh();
    } catch {
      setError("재요청문 생성 중 오류가 발생했습니다.");
    } finally {
      setRerequestLoading(false);
    }
  }

  async function handleDeleteCampaign() {
    if (!window.confirm("이 캠페인을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error);
      return;
    }
    router.push("/campaigns");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>{campaign.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {TAX_TYPE_LABELS[campaign.taxType]}
                {campaign.submissionDeadlineLabel
                  ? ` · 제출 기한: ${campaign.submissionDeadlineLabel}`
                  : ""}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleDeleteCampaign()}
            >
              캠페인 삭제
            </Button>
          </div>
          {campaign.memo && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {campaign.memo}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="전체" value={campaign.stats.total} />
            <Stat label="미요청" value={campaign.stats.notRequested} />
            <Stat label="요청함" value={campaign.stats.requested} />
            <Stat label="일부제출" value={campaign.stats.partial} />
            <Stat label="재요청필요" value={campaign.stats.rerequestNeeded} />
            <Stat label="완료" value={campaign.stats.completed} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">거래처별 진행</CardTitle>
          <div className="flex flex-wrap gap-2">
            <LoadingButton
              type="button"
              size="sm"
              loading={bulkLoading}
              onClick={() => void handleBulkGenerate()}
            >
              {selectedIds.length > 0
                ? `선택 ${selectedIds.length}건 생성`
                : "미요청 일괄 생성"}
            </LoadingButton>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">선택</th>
                  <th className="px-3 py-2 font-medium">고객</th>
                  <th className="px-3 py-2 font-medium">상태</th>
                  <th className="px-3 py-2 font-medium">미제출 자료</th>
                  <th className="px-3 py-2 font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {campaign.items.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelected(item.id)}
                      />
                    </td>
                    <td className="px-3 py-3 font-medium">{item.clientName}</td>
                    <td className="px-3 py-3">
                      <select
                        className={selectClassName}
                        value={item.status}
                        onChange={(e) =>
                          void updateItemStatus(
                            item.id,
                            e.target.value as CampaignItemStatus,
                            item.missingItems,
                          )
                        }
                      >
                        {CAMPAIGN_ITEM_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {CAMPAIGN_ITEM_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {item.missingItems?.trim() ? (
                        <span className="line-clamp-2">{item.missingItems}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRerequestItemId(item.id);
                            setMissingItems(item.missingItems ?? "");
                          }}
                        >
                          재요청문
                        </Button>
                        <Link
                          href={`/requests?clientId=${item.clientId}`}
                          className="inline-flex h-8 items-center rounded-md border border-input px-3 text-xs hover:bg-muted"
                        >
                          단건 생성
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-muted-foreground" role="status">
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      {rerequestItem && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {rerequestItem.clientName} 재요청문 생성
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="missingItems">미제출 자료</Label>
              <Textarea
                id="missingItems"
                value={missingItems}
                onChange={(e) => setMissingItems(e.target.value)}
                placeholder="통장 내역, 카드 매출, 인건비 자료 등 (줄바꿈 또는 쉼표로 구분)"
                rows={5}
              />
            </div>
            <div className="flex gap-2">
              <LoadingButton
                type="button"
                loading={rerequestLoading}
                onClick={() => void handleRerequest()}
              >
                재요청문 생성
              </LoadingButton>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRerequestItemId(null);
                  setMissingItems("");
                }}
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {generatedRows.length > 0 && (
        <div className="space-y-4">
          {generatedRows.map((row) => (
            <div key={`${row.itemId}-${row.clientName}`} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{row.clientName}</p>
                <CopyButton text={row.result} />
              </div>
              <GeneratedOutput
                title="생성 결과"
                content={row.result}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
