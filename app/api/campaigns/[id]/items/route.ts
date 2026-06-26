import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import {
  assertCampaignAccess,
  addClientsToCampaign,
  CampaignAccessError,
  getDocumentCampaignDetail,
} from "@/lib/document-campaign/service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { campaignAddClientsSchema, firstZodErrorMessage } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = campaignAddClientsSchema.safeParse(body);
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

    await addClientsToCampaign(supabase, id, parsed.data.clientIds);
    const updated = await getDocumentCampaignDetail(supabase, id);
    return successResponse({ campaign: updated });
  } catch (error) {
    if (error instanceof CampaignAccessError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(
      error instanceof Error ? error.message : "고객 추가에 실패했습니다.",
      400,
    );
  }
}
