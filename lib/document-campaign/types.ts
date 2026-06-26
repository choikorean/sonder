import type { TaxType } from "@/lib/constants";

export const CAMPAIGN_ITEM_STATUSES = [
  "not_requested",
  "requested",
  "partial",
  "completed",
  "rerequest_needed",
] as const;

export type CampaignItemStatus = (typeof CAMPAIGN_ITEM_STATUSES)[number];

export const CAMPAIGN_ITEM_STATUS_LABELS: Record<CampaignItemStatus, string> = {
  not_requested: "미요청",
  requested: "요청함",
  partial: "일부제출",
  completed: "완료",
  rerequest_needed: "재요청필요",
};

/** 대시보드·캠페인 요약에서 「미제출·후속 필요」로 집계하는 상태 */
export const PENDING_CAMPAIGN_STATUSES: CampaignItemStatus[] = [
  "not_requested",
  "partial",
  "rerequest_needed",
];

export type DocumentCampaign = {
  id: string;
  title: string;
  taxType: TaxType;
  memo: string | null;
  seasonPresetId: string | null;
  submissionDeadlineLabel: string | null;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentCampaignItem = {
  id: string;
  campaignId: string;
  clientId: string;
  clientName: string;
  clientBusinessType: string | null;
  status: CampaignItemStatus;
  missingItems: string | null;
  lastRequestId: string | null;
  lastRerequestId: string | null;
  requestedAt: string | null;
  updatedAt: string;
};

export type DocumentCampaignDetail = DocumentCampaign & {
  items: DocumentCampaignItem[];
  stats: CampaignItemStats;
};

export type CampaignItemStats = {
  total: number;
  notRequested: number;
  requested: number;
  partial: number;
  completed: number;
  rerequestNeeded: number;
  pending: number;
};

export function computeCampaignItemStats(
  items: Pick<DocumentCampaignItem, "status">[],
): CampaignItemStats {
  const stats: CampaignItemStats = {
    total: items.length,
    notRequested: 0,
    requested: 0,
    partial: 0,
    completed: 0,
    rerequestNeeded: 0,
    pending: 0,
  };

  for (const item of items) {
    switch (item.status) {
      case "not_requested":
        stats.notRequested += 1;
        break;
      case "requested":
        stats.requested += 1;
        break;
      case "partial":
        stats.partial += 1;
        break;
      case "completed":
        stats.completed += 1;
        break;
      case "rerequest_needed":
        stats.rerequestNeeded += 1;
        break;
    }
    if (PENDING_CAMPAIGN_STATUSES.includes(item.status)) {
      stats.pending += 1;
    }
  }

  return stats;
}
