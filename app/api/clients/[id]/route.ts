import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { getClientById } from "@/lib/clients";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { clientUpdateSchema, firstZodErrorMessage } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
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

  const { id } = await context.params;
  const existing = await getClientById(supabase, id);
  if (!existing) {
    return errorResponse("고객을 찾을 수 없습니다.", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = clientUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  if (Object.keys(parsed.data).length === 0) {
    return errorResponse("수정할 내용이 없습니다.", 400);
  }

  const updates: {
    name?: string;
    contact_name?: string | null;
    business_type?: string | null;
    phone?: string | null;
    email?: string | null;
    memo?: string | null;
    is_active?: boolean;
  } = {};
  const { name, contactName, businessType, phone, email, memo, isActive } =
    parsed.data;

  if (name !== undefined) updates.name = name;
  if (contactName !== undefined) updates.contact_name = contactName;
  if (businessType !== undefined) updates.business_type = businessType;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (memo !== undefined) updates.memo = memo;
  if (isActive !== undefined) updates.is_active = isActive;

  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select(
      "id, name, contact_name, business_type, phone, email, memo, is_active, organization_id, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    return errorResponse("고객 정보 수정에 실패했습니다.", 500);
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
}
