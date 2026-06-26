import "server-only";

import { resolveClientScope } from "@/lib/clients";
import type { TaxType } from "@/lib/constants";
import { resolveCampaignPresetDefaults } from "@/lib/document-campaign/presets";
import {
  computeCampaignItemStats,
  type CampaignItemStatus,
  type DocumentCampaign,
  type DocumentCampaignDetail,
  type DocumentCampaignItem,
} from "@/lib/document-campaign/types";
import type { SubscriberContext } from "@/lib/subscriber-context";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export class CampaignAccessError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

export function assertCampaignAccess(ctx: SubscriberContext) {
  if (!ctx.capabilities.clientProfiles) {
    throw new CampaignAccessError(
      "자료 캠페인은 Pro·Team 요금제(또는 무료 체험)에서 이용할 수 있습니다.",
      403,
    );
  }

  const scope = resolveClientScope({
    subscription: ctx.subscription,
    organizationId: ctx.organization?.id,
  });

  if (scope.requiresOrganization && !scope.organizationId) {
    throw new CampaignAccessError(
      "Team 자료 캠페인은 사무소에 소속된 후 이용할 수 있습니다.",
      403,
    );
  }

  return scope;
}

function mapCampaignRow(row: {
  id: string;
  title: string;
  tax_type: string;
  memo: string | null;
  season_preset_id: string | null;
  submission_deadline_label: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}): DocumentCampaign {
  return {
    id: row.id,
    title: row.title,
    taxType: row.tax_type as TaxType,
    memo: row.memo,
    seasonPresetId: row.season_preset_id,
    submissionDeadlineLabel: row.submission_deadline_label,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCampaignItemRow(row: {
  id: string;
  campaign_id: string;
  client_id: string;
  status: string;
  missing_items: string | null;
  last_request_id: string | null;
  last_rerequest_id: string | null;
  requested_at: string | null;
  updated_at: string;
  clients: { name: string; business_type: string | null } | null;
}): DocumentCampaignItem {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    clientId: row.client_id,
    clientName: row.clients?.name ?? "고객",
    clientBusinessType: row.clients?.business_type ?? null,
    status: row.status as CampaignItemStatus,
    missingItems: row.missing_items,
    lastRequestId: row.last_request_id,
    lastRerequestId: row.last_rerequest_id,
    requestedAt: row.requested_at,
    updatedAt: row.updated_at,
  };
}

export async function listDocumentCampaigns(
  supabase: SupabaseServer,
  scope: { organizationId: string | null; userId: string },
): Promise<DocumentCampaign[]> {
  let query = supabase
    .from("document_campaigns")
    .select(
      "id, title, tax_type, memo, season_preset_id, submission_deadline_label, organization_id, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (scope.organizationId) {
    query = query.eq("organization_id", scope.organizationId);
  } else {
    query = query.eq("user_id", scope.userId).is("organization_id", null);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("캠페인 목록을 불러오지 못했습니다.");
  }

  return (data ?? []).map(mapCampaignRow);
}

export async function getDocumentCampaignDetail(
  supabase: SupabaseServer,
  campaignId: string,
): Promise<DocumentCampaignDetail | null> {
  const { data: campaign, error: campaignError } = await supabase
    .from("document_campaigns")
    .select(
      "id, title, tax_type, memo, season_preset_id, submission_deadline_label, organization_id, created_at, updated_at",
    )
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) {
    throw new Error("캠페인을 불러오지 못했습니다.");
  }
  if (!campaign) return null;

  const { data: items, error: itemsError } = await supabase
    .from("document_campaign_items")
    .select(
      "id, campaign_id, client_id, status, missing_items, last_request_id, last_rerequest_id, requested_at, updated_at, clients(name, business_type)",
    )
    .eq("campaign_id", campaignId)
    .order("updated_at", { ascending: false });

  if (itemsError) {
    throw new Error("캠페인 고객 목록을 불러오지 못했습니다.");
  }

  const mappedItems = (items ?? []).map((row) =>
    mapCampaignItemRow(
      row as Parameters<typeof mapCampaignItemRow>[0],
    ),
  );

  return {
    ...mapCampaignRow(campaign),
    items: mappedItems,
    stats: computeCampaignItemStats(mappedItems),
  };
}

export async function createDocumentCampaign(
  supabase: SupabaseServer,
  input: {
    userId: string;
    organizationId: string | null;
    title?: string;
    taxType?: TaxType;
    memo?: string | null;
    seasonPresetId?: string | null;
    submissionDeadlineLabel?: string | null;
    clientIds: string[];
  },
): Promise<DocumentCampaignDetail> {
  const defaults = resolveCampaignPresetDefaults({
    seasonPresetId: input.seasonPresetId,
    taxType: input.taxType,
    title: input.title,
    memo: input.memo,
  });

  const uniqueClientIds = [...new Set(input.clientIds)];
  if (uniqueClientIds.length === 0) {
    throw new Error("캠페인에 포함할 고객을 1명 이상 선택해 주세요.");
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("document_campaigns")
    .insert({
      user_id: input.userId,
      organization_id: input.organizationId,
      title: defaults.title,
      tax_type: defaults.taxType,
      memo: defaults.memo || null,
      season_preset_id: defaults.seasonPresetId,
      submission_deadline_label:
        input.submissionDeadlineLabel ?? defaults.submissionDeadlineLabel,
    })
    .select(
      "id, title, tax_type, memo, season_preset_id, submission_deadline_label, organization_id, created_at, updated_at",
    )
    .single();

  if (campaignError || !campaign) {
    throw new Error("캠페인 생성에 실패했습니다.");
  }

  const itemRows = uniqueClientIds.map((clientId) => ({
    campaign_id: campaign.id,
    client_id: clientId,
    status: "not_requested" as const,
  }));

  const { error: itemsError } = await supabase
    .from("document_campaign_items")
    .insert(itemRows);

  if (itemsError) {
    await supabase.from("document_campaigns").delete().eq("id", campaign.id);
    throw new Error("캠페인 고객 등록에 실패했습니다.");
  }

  const detail = await getDocumentCampaignDetail(supabase, campaign.id);
  if (!detail) {
    throw new Error("캠페인을 불러오지 못했습니다.");
  }
  return detail;
}

export async function updateCampaignItemStatus(
  supabase: SupabaseServer,
  itemId: string,
  status: CampaignItemStatus,
  missingItems?: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("document_campaign_items")
    .update({
      status,
      missing_items: missingItems ?? null,
    })
    .eq("id", itemId);

  if (error) {
    throw new Error("고객 상태 업데이트에 실패했습니다.");
  }
}

export async function markCampaignItemRequested(
  supabase: SupabaseServer,
  itemId: string,
  requestId: string,
  mode: "initial" | "rerequest",
): Promise<void> {
  const patch =
    mode === "initial"
      ? {
          status: "requested" as const,
          last_request_id: requestId,
          requested_at: new Date().toISOString(),
        }
      : {
          status: "requested" as const,
          last_rerequest_id: requestId,
        };

  const { error } = await supabase
    .from("document_campaign_items")
    .update(patch)
    .eq("id", itemId);

  if (error) {
    throw new Error("캠페인 상태 반영에 실패했습니다.");
  }
}

export async function addClientsToCampaign(
  supabase: SupabaseServer,
  campaignId: string,
  clientIds: string[],
): Promise<void> {
  const uniqueClientIds = [...new Set(clientIds)];
  if (uniqueClientIds.length === 0) return;

  const rows = uniqueClientIds.map((clientId) => ({
    campaign_id: campaignId,
    client_id: clientId,
    status: "not_requested" as const,
  }));

  const { error } = await supabase.from("document_campaign_items").insert(rows);
  if (error) {
    throw new Error("고객 추가에 실패했습니다. 이미 포함된 고객일 수 있습니다.");
  }
}

export async function removeCampaignItem(
  supabase: SupabaseServer,
  itemId: string,
): Promise<void> {
  const { error } = await supabase
    .from("document_campaign_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    throw new Error("고객 제거에 실패했습니다.");
  }
}

export async function deleteDocumentCampaign(
  supabase: SupabaseServer,
  campaignId: string,
): Promise<void> {
  const { error } = await supabase
    .from("document_campaigns")
    .delete()
    .eq("id", campaignId);

  if (error) {
    throw new Error("캠페인 삭제에 실패했습니다.");
  }
}

export async function getCampaignDashboardStats(
  supabase: SupabaseServer,
  scope: { organizationId: string | null; userId: string },
): Promise<{ activeCampaigns: number; pendingItems: number }> {
  let campaignQuery = supabase.from("document_campaigns").select("id");

  if (scope.organizationId) {
    campaignQuery = campaignQuery.eq("organization_id", scope.organizationId);
  } else {
    campaignQuery = campaignQuery
      .eq("user_id", scope.userId)
      .is("organization_id", null);
  }

  const { data: campaigns, error: campaignError } = await campaignQuery;
  if (campaignError || !campaigns?.length) {
    return { activeCampaigns: 0, pendingItems: 0 };
  }

  const campaignIds = campaigns.map((row) => row.id);
  const { data: items, error: itemsError } = await supabase
    .from("document_campaign_items")
    .select("status")
    .in("campaign_id", campaignIds)
    .in("status", ["not_requested", "partial", "rerequest_needed"]);

  if (itemsError) {
    return { activeCampaigns: campaigns.length, pendingItems: 0 };
  }

  return {
    activeCampaigns: campaigns.length,
    pendingItems: items?.length ?? 0,
  };
}

export async function getCampaignItemForGeneration(
  supabase: SupabaseServer,
  itemId: string,
): Promise<{
  item: DocumentCampaignItem;
  campaign: DocumentCampaign;
} | null> {
  const { data, error } = await supabase
    .from("document_campaign_items")
    .select(
      "id, campaign_id, client_id, status, missing_items, last_request_id, last_rerequest_id, requested_at, updated_at, clients(name, business_type), document_campaigns(id, title, tax_type, memo, season_preset_id, submission_deadline_label, organization_id, created_at, updated_at)",
    )
    .eq("id", itemId)
    .maybeSingle();

  if (error || !data) return null;

  const campaignRow = (
    data as {
      document_campaigns: Parameters<typeof mapCampaignRow>[0] | null;
    }
  ).document_campaigns;
  if (!campaignRow) return null;

  return {
    item: mapCampaignItemRow(
      data as Parameters<typeof mapCampaignItemRow>[0],
    ),
    campaign: mapCampaignRow(campaignRow),
  };
}
