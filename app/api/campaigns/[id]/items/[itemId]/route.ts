import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import {
  assertCampaignAccess,
  CampaignAccessError,
  getDocumentCampaignDetail,
  removeCampaignItem,
  updateCampaignItemStatus,
} from "@/lib/document-campaign/service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { campaignItemUpdateSchema, firstZodErrorMessage } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const { id, itemId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = campaignItemUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  const ctx = await getSubscriberContext(supabase);

  try {
    assertCampaignAccess(ctx);
    const campaign = await getDocumentCampaignDetail(supabase, id);
    if (!campaign) {
      return errorResponse("캠페인을 찾을 수 없습니다.", 404);
    }

    const item = campaign.items.find((row) => row.id === itemId);
    if (!item) {
      return errorResponse("캠페인 고객을 찾을 수 없습니다.", 404);
    }

    await updateCampaignItemStatus(
      supabase,
      itemId,
      parsed.data.status,
      parsed.data.missingItems,
    );

    const updated = await getDocumentCampaignDetail(supabase, id);
    return successResponse({ campaign: updated });
  } catch (error) {
    if (error instanceof CampaignAccessError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("상태 업데이트에 실패했습니다.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const { id, itemId } = await context.params;
  const ctx = await getSubscriberContext(supabase);

  try {
    assertCampaignAccess(ctx);
    const campaign = await getDocumentCampaignDetail(supabase, id);
    if (!campaign) {
      return errorResponse("캠페인을 찾을 수 없습니다.", 404);
    }

    const item = campaign.items.find((row) => row.id === itemId);
    if (!item) {
      return errorResponse("캠페인 고객을 찾을 수 없습니다.", 404);
    }

    await removeCampaignItem(supabase, itemId);
    const updated = await getDocumentCampaignDetail(supabase, id);
    return successResponse({ campaign: updated });
  } catch (error) {
    if (error instanceof CampaignAccessError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("고객 제거에 실패했습니다.", 500);
  }
}
