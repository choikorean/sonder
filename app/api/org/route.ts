import { getAuthContext } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import {
  buildInviteUrl,
  createOrganizationInvite,
  ensureTeamOrganization,
  getOrganizationContext,
} from "@/lib/org";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { successResponse, errorResponse } from "@/lib/api-response";
import { orgInviteSchema, firstZodErrorMessage } from "@/lib/validators";
import { PLANS } from "@/lib/plans";

export async function GET() {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const ctx = await getSubscriberContext(supabase);
  let organization = ctx.organization;

  if (
    !organization &&
    ctx.subscription.effectivePlanId === "team" &&
    ctx.subscription.isActive
  ) {
    const service = createServiceClient();
    await ensureTeamOrganization(service, {
      ownerUserId: user.id,
      seatLimit: PLANS.team.seats,
    });
    organization = await getOrganizationContext(supabase, user.id);
  }

  return successResponse({
    organization,
    canManageTeam:
      Boolean(organization) &&
      ctx.subscription.effectivePlanId === "team" &&
      ctx.subscription.isActive,
    seatLimit: organization?.seatLimit ?? PLANS.team.seats,
  });
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const ctx = await getSubscriberContext(supabase);
  if (ctx.subscription.effectivePlanId !== "team" || !ctx.subscription.isActive) {
    return errorResponse("팀 초대는 Team 요금제에서 이용할 수 있습니다.", 403);
  }

  let organization = ctx.organization;
  if (!organization) {
    const service = createServiceClient();
    await ensureTeamOrganization(service, {
      ownerUserId: user.id,
      seatLimit: PLANS.team.seats,
    });
    organization = await getOrganizationContext(supabase, user.id);
  }

  if (!organization?.canManageMembers) {
    return errorResponse("팀원 초대 권한이 없습니다.", 403);
  }

  if (organization.activeMemberCount >= organization.seatLimit) {
    return errorResponse("좌석이 모두 사용 중입니다.", 409);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = orgInviteSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  try {
    const service = createServiceClient();
    const invite = await createOrganizationInvite(service, {
      organizationId: organization.id,
      invitedBy: user.id,
      email: parsed.data.email,
    });

    return successResponse({
      token: invite.token,
      inviteUrl: buildInviteUrl(invite.token),
      expiresAt: invite.expires_at,
      seatsUsed: organization.activeMemberCount,
      seatLimit: organization.seatLimit,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "초대 링크 생성에 실패했습니다.",
      500,
    );
  }
}
