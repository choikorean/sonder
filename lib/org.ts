import "server-only";

import { PLANS } from "@/lib/plans";
import { createServiceClient } from "@/lib/supabase/service";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;
type ServiceClient = ReturnType<typeof createServiceClient>;

export type OrgRole = "owner" | "admin" | "member";

export type OrgMember = {
  userId: string;
  role: OrgRole;
  name: string | null;
  email: string | null;
  joinedAt: string;
};

export type OrganizationContext = {
  id: string;
  name: string;
  ownerUserId: string;
  seatLimit: number;
  role: OrgRole;
  members: OrgMember[];
  memberUserIds: string[];
  activeMemberCount: number;
  canManageMembers: boolean;
};

const INVITE_TTL_DAYS = 7;

function displayName(
  name: string | null | undefined,
  officeName: string | null | undefined,
  email: string | null | undefined,
) {
  return name?.trim() || officeName?.trim() || email?.trim() || "이름 없음";
}

export async function getOrganizationContext(
  supabase: SupabaseServer,
  userId: string,
): Promise<OrganizationContext | null> {
  const { data: membership } = await supabase
    .from("organization_members")
    .select(
      "role, organization_id, joined_at, organizations(id, name, owner_user_id, seat_limit)",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  const org = membership?.organizations;
  if (!membership?.organization_id || !org) {
    return null;
  }

  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("user_id, role, joined_at")
    .eq("organization_id", membership.organization_id)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  const userIds = (memberRows ?? []).map((row) => row.user_id);
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, office_name, email")
        .in("id", userIds)
    : { data: [] as const };

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  const members: OrgMember[] = (memberRows ?? []).map((row) => {
    const profile = profileById.get(row.user_id);
    return {
      userId: row.user_id,
      role: row.role as OrgRole,
      name: displayName(profile?.name, profile?.office_name, profile?.email),
      email: profile?.email ?? null,
      joinedAt: row.joined_at,
    };
  });

  const role = membership.role as OrgRole;

  return {
    id: org.id,
    name: org.name,
    ownerUserId: org.owner_user_id,
    seatLimit: org.seat_limit,
    role,
    members,
    memberUserIds: userIds,
    activeMemberCount: members.length,
    canManageMembers: role === "owner" || role === "admin",
  };
}

export async function ensureTeamOrganization(
  service: ServiceClient,
  params: {
    ownerUserId: string;
    organizationName?: string | null;
    seatLimit?: number;
  },
): Promise<string> {
  const seatLimit = params.seatLimit ?? PLANS.team.seats;

  const { data: existingSub } = await service
    .from("subscriptions")
    .select("organization_id")
    .eq("user_id", params.ownerUserId)
    .maybeSingle();

  if (existingSub?.organization_id) {
    return existingSub.organization_id;
  }

  const { data: existingOrg } = await service
    .from("organizations")
    .select("id")
    .eq("owner_user_id", params.ownerUserId)
    .maybeSingle();

  let organizationId = existingOrg?.id;

  if (!organizationId) {
    const orgName =
      params.organizationName?.trim() ||
      (await loadOfficeName(service, params.ownerUserId)) ||
      "우리 사무소";

    const { data: createdOrg, error: orgError } = await service
      .from("organizations")
      .insert({
        name: orgName,
        owner_user_id: params.ownerUserId,
        seat_limit: seatLimit,
      })
      .select("id")
      .single();

    if (orgError || !createdOrg) {
      throw new Error("조직 생성에 실패했습니다.");
    }

    organizationId = createdOrg.id;

    const { error: ownerMemberError } = await service
      .from("organization_members")
      .upsert(
        {
          organization_id: organizationId,
          user_id: params.ownerUserId,
          role: "owner",
          status: "active",
        },
        { onConflict: "organization_id,user_id" },
      );

    if (ownerMemberError) {
      throw new Error("조직 소유자 등록에 실패했습니다.");
    }
  }

  await service
    .from("subscriptions")
    .update({ organization_id: organizationId })
    .eq("user_id", params.ownerUserId);

  return organizationId;
}

async function loadOfficeName(service: ServiceClient, userId: string) {
  const { data } = await service
    .from("profiles")
    .select("office_name, name")
    .eq("id", userId)
    .maybeSingle();
  return data?.office_name?.trim() || data?.name?.trim() || null;
}

export async function createOrganizationInvite(
  service: ServiceClient,
  params: {
    organizationId: string;
    invitedBy: string;
    email?: string | null;
  },
) {
  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + INVITE_TTL_DAYS);

  const { data, error } = await service
    .from("organization_invites")
    .insert({
      organization_id: params.organizationId,
      invited_by: params.invitedBy,
      email: params.email?.trim() || null,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, token, expires_at")
    .single();

  if (error || !data) {
    throw new Error("초대 링크 생성에 실패했습니다.");
  }

  return data;
}

export async function getInvitePreview(
  service: ServiceClient,
  token: string,
) {
  const { data: invite } = await service
    .from("organization_invites")
    .select("id, organization_id, expires_at, accepted_at, organizations(name)")
    .eq("token", token)
    .maybeSingle();

  if (!invite || invite.accepted_at) {
    return null;
  }

  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return {
    organizationId: invite.organization_id,
    organizationName: invite.organizations?.name ?? "사무소",
    expiresAt: invite.expires_at,
  };
}

export async function acceptOrganizationInvite(
  service: ServiceClient,
  params: { token: string; userId: string },
) {
  const { data: invite } = await service
    .from("organization_invites")
    .select("id, organization_id, expires_at, accepted_at, organizations(seat_limit)")
    .eq("token", params.token)
    .maybeSingle();

  if (!invite || invite.accepted_at) {
    throw new Error("유효하지 않거나 이미 사용된 초대 링크입니다.");
  }

  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    throw new Error("만료된 초대 링크입니다.");
  }

  const { data: existingMembership } = await service
    .from("organization_members")
    .select("id")
    .eq("user_id", params.userId)
    .eq("status", "active")
    .maybeSingle();

  if (existingMembership) {
    throw new Error("이미 다른 사무소에 소속되어 있습니다.");
  }

  const { count } = await service
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", invite.organization_id)
    .eq("status", "active");

  const seatLimit = invite.organizations?.seat_limit ?? PLANS.team.seats;
  if ((count ?? 0) >= seatLimit) {
    throw new Error("사무소 좌석이 모두 사용 중입니다. 관리자에게 문의해 주세요.");
  }

  const { error: memberError } = await service.from("organization_members").insert({
    organization_id: invite.organization_id,
    user_id: params.userId,
    role: "member",
    status: "active",
  });

  if (memberError) {
    throw new Error("사무소 가입에 실패했습니다.");
  }

  await service
    .from("organization_invites")
    .update({
      accepted_at: new Date().toISOString(),
      accepted_by: params.userId,
    })
    .eq("id", invite.id);

  return { organizationId: invite.organization_id };
}

export function buildInviteUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/join?token=${token}`;
}

export function canAccessTeamFeatures(
  organization: OrganizationContext | null,
  effectivePlanId: string,
  isActive: boolean,
) {
  return Boolean(
    organization && effectivePlanId === "team" && isActive,
  );
}
