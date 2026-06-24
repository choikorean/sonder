import "server-only";

import type { BusinessType } from "@/lib/constants";
import type { PlanCapabilities } from "@/lib/plan-capabilities";
import type { PromptClient } from "@/lib/prompt-client";
import { CLIENT_LIMITS } from "@/lib/plans";
import type { CurrentSubscription } from "@/lib/subscription";
import type { createClient } from "@/lib/supabase/server";

export type { PromptClient } from "@/lib/prompt-client";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export type ClientRecord = {
  id: string;
  name: string;
  contactName: string | null;
  businessType: BusinessType | null;
  phone: string | null;
  email: string | null;
  memo: string | null;
  isActive: boolean;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapClientRow(row: {
  id: string;
  name: string;
  contact_name: string | null;
  business_type: string | null;
  phone: string | null;
  email: string | null;
  memo: string | null;
  is_active: boolean;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}): ClientRecord {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name,
    businessType: (row.business_type as BusinessType | null) ?? null,
    phone: row.phone,
    email: row.email,
    memo: row.memo,
    isActive: row.is_active,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Pro/Team·체험 중 고객 등록 한도 (0 = 이용 불가) */
export function getClientLimit(input: {
  capabilities: PlanCapabilities;
  subscription: CurrentSubscription;
}): number {
  if (!input.capabilities.clientProfiles) {
    return 0;
  }

  const planForLimit = input.subscription.isTrialing
    ? input.subscription.planId
    : input.subscription.effectivePlanId;

  if (planForLimit === "team") {
    return CLIENT_LIMITS.team;
  }

  if (
    planForLimit === "pro" ||
    (input.subscription.isTrialing && input.subscription.planId === "free")
  ) {
    return CLIENT_LIMITS.pro;
  }

  return 0;
}

export function isTeamClientScope(organizationId: string | null | undefined) {
  return Boolean(organizationId);
}

/** Pro: 개인 고객 / Team: 사무소 공유 고객 */
export function resolveClientScope(input: {
  subscription: CurrentSubscription;
  organizationId: string | null | undefined;
}): {
  isTeamScope: boolean;
  organizationId: string | null;
  requiresOrganization: boolean;
} {
  const isTeamPlan =
    input.subscription.effectivePlanId === "team" ||
    (input.subscription.isTrialing && input.subscription.planId === "team");

  if (!isTeamPlan) {
    return {
      isTeamScope: false,
      organizationId: null,
      requiresOrganization: false,
    };
  }

  return {
    isTeamScope: Boolean(input.organizationId),
    organizationId: input.organizationId ?? null,
    requiresOrganization: true,
  };
}

export async function listClients(
  supabase: SupabaseServer,
  options: {
    organizationId: string | null;
    userId: string;
    includeInactive?: boolean;
  },
): Promise<ClientRecord[]> {
  let query = supabase
    .from("clients")
    .select(
      "id, name, contact_name, business_type, phone, email, memo, is_active, organization_id, created_at, updated_at",
    )
    .order("name", { ascending: true });

  if (options.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  } else {
    query = query.eq("user_id", options.userId).is("organization_id", null);
  }

  if (!options.includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("고객 목록을 불러오지 못했습니다.");
  }

  return (data ?? []).map(mapClientRow);
}

export async function countActiveClients(
  supabase: SupabaseServer,
  options: {
    organizationId: string | null;
    userId: string;
  },
): Promise<number> {
  let query = supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (options.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  } else {
    query = query.eq("user_id", options.userId).is("organization_id", null);
  }

  const { count, error } = await query;
  if (error) {
    throw new Error("고객 수를 확인하지 못했습니다.");
  }

  return count ?? 0;
}

export async function getClientById(
  supabase: SupabaseServer,
  clientId: string,
): Promise<ClientRecord | null> {
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, name, contact_name, business_type, phone, email, memo, is_active, organization_id, created_at, updated_at",
    )
    .eq("id", clientId)
    .maybeSingle();

  if (error) {
    throw new Error("고객 정보를 불러오지 못했습니다.");
  }

  return data ? mapClientRow(data) : null;
}

export class ClientGenerationError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "ClientGenerationError";
  }
}

export function toPromptClient(client: ClientRecord): PromptClient {
  return {
    name: client.name,
    contactName: client.contactName,
    businessType: client.businessType,
    memo: client.memo,
  };
}

export function mergeGenerationMemo(
  memo?: string | null,
  clientMemo?: string | null,
): string | null {
  const parts = [clientMemo?.trim(), memo?.trim()].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join("\n\n") : null;
}

/** 생성 API용 고객 검증 (Pro/Team·체험, 활성 고객, 스코프 일치) */
export async function resolveClientForGeneration(
  supabase: SupabaseServer,
  input: {
    capabilities: PlanCapabilities;
    subscription: CurrentSubscription;
    organizationId: string | null | undefined;
    clientId?: string | null;
  },
): Promise<{ clientId: string | null; client: PromptClient | null }> {
  const { clientId } = input;
  if (!clientId) {
    return { clientId: null, client: null };
  }

  if (!input.capabilities.clientProfiles) {
    throw new ClientGenerationError(
      "고객 연결은 Pro·Team 요금제(또는 무료 체험)에서 이용할 수 있습니다.",
      403,
    );
  }

  const record = await getClientById(supabase, clientId);
  if (!record || !record.isActive) {
    throw new ClientGenerationError("선택한 고객을 찾을 수 없습니다.", 404);
  }

  const scope = resolveClientScope({
    subscription: input.subscription,
    organizationId: input.organizationId,
  });

  if (scope.isTeamScope) {
    if (record.organizationId !== scope.organizationId) {
      throw new ClientGenerationError("선택한 고객을 찾을 수 없습니다.", 404);
    }
  } else if (record.organizationId !== null) {
    throw new ClientGenerationError("선택한 고객을 찾을 수 없습니다.", 404);
  }

  return { clientId, client: toPromptClient(record) };
}
