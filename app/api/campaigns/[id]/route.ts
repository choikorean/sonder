import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import {
  assertCampaignAccess,
  CampaignAccessError,
  deleteDocumentCampaign,
  getDocumentCampaignDetail,
} from "@/lib/document-campaign/service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSubscriberContext } from "@/lib/subscriber-context";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const { id } = await context.params;
  const ctx = await getSubscriberContext(supabase);

  try {
    assertCampaignAccess(ctx);
    const campaign = await getDocumentCampaignDetail(supabase, id);
    if (!campaign) {
      return errorResponse("캠페인을 찾을 수 없습니다.", 404);
    }
    return successResponse({ campaign });
  } catch (error) {
    if (error instanceof CampaignAccessError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("캠페인을 불러오지 못했습니다.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const { id } = await context.params;
  const ctx = await getSubscriberContext(supabase);

  try {
    assertCampaignAccess(ctx);
    const campaign = await getDocumentCampaignDetail(supabase, id);
    if (!campaign) {
      return errorResponse("캠페인을 찾을 수 없습니다.", 404);
    }
    await deleteDocumentCampaign(supabase, id);
    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof CampaignAccessError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("캠페인 삭제에 실패했습니다.", 500);
  }
}
