import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import {
  countActiveClients,
  getClientLimit,
  listClients,
  resolveClientScope,
} from "@/lib/clients";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { clientSchema, firstZodErrorMessage } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const ctx = await getSubscriberContext(supabase);
  if (!ctx.capabilities.clientProfiles) {
    return errorResponse(
      "고객 등록은 Pro·Team 요금제(또는 무료 체험)에서 이용할 수 있습니다.",
      403,
    );
  }

  const scope = resolveClientScope({
    subscription: ctx.subscription,
    organizationId: ctx.organization?.id,
  });

  if (scope.requiresOrganization && !scope.organizationId) {
    return errorResponse(
      "Team 고객 등록은 사무소에 소속된 후 이용할 수 있습니다.",
      403,
    );
  }

  const includeInactive =
    request.nextUrl.searchParams.get("includeInactive") === "1";

  try {
    const [clients, activeCount, limit] = await Promise.all([
      listClients(supabase, {
        organizationId: scope.organizationId,
        userId: user.id,
        includeInactive,
      }),
      countActiveClients(supabase, {
        organizationId: scope.organizationId,
        userId: user.id,
      }),
      Promise.resolve(
        getClientLimit({
          capabilities: ctx.capabilities,
          subscription: ctx.subscription,
        }),
      ),
    ]);

    return successResponse({
      clients,
      activeCount,
      limit,
      isTeamShared: scope.isTeamScope,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "고객 목록을 불러오지 못했습니다.";
    return errorResponse(message, 500);
  }
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const ctx = await getSubscriberContext(supabase);
  if (!ctx.capabilities.clientProfiles) {
    return errorResponse(
      "고객 등록은 Pro·Team 요금제(또는 무료 체험)에서 이용할 수 있습니다.",
      403,
    );
  }

  const scope = resolveClientScope({
    subscription: ctx.subscription,
    organizationId: ctx.organization?.id,
  });

  if (scope.requiresOrganization && !scope.organizationId) {
    return errorResponse(
      "Team 고객 등록은 사무소에 소속된 후 이용할 수 있습니다.",
      403,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  const limit = getClientLimit({
    capabilities: ctx.capabilities,
    subscription: ctx.subscription,
  });

  try {
    const activeCount = await countActiveClients(supabase, {
      organizationId: scope.organizationId,
      userId: user.id,
    });

    if (activeCount >= limit) {
      return errorResponse(
        `고객 등록 한도(${limit.toLocaleString()}명)에 도달했습니다.`,
        429,
      );
    }

    const { name, contactName, businessType, phone, email, memo } =
      parsed.data;

    const { data, error } = await supabase
      .from("clients")
      .insert({
        user_id: user.id,
        organization_id: scope.organizationId,
        name,
        contact_name: contactName ?? null,
        business_type: businessType ?? null,
        phone: phone ?? null,
        email: email ?? null,
        memo: memo ?? null,
        is_active: true,
      })
      .select(
        "id, name, contact_name, business_type, phone, email, memo, is_active, organization_id, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      return errorResponse("고객 등록에 실패했습니다.", 500);
    }

    return successResponse({
      client: {
        id: data.id,
        name: data.name,
        contactName: data.contact_name,
        businessType: data.business_type,
        phone: data.phone,
        email: data.email,
        memo: data.memo,
        isActive: data.is_active,
        organizationId: data.organization_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "고객 등록에 실패했습니다.";
    return errorResponse(message, 500);
  }
}
