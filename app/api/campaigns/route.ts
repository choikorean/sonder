import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import {
  assertCampaignAccess,
  CampaignAccessError,
  createDocumentCampaign,
  listDocumentCampaigns,
} from "@/lib/document-campaign/service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { campaignCreateSchema, firstZodErrorMessage } from "@/lib/validators";

export async function GET() {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const ctx = await getSubscriberContext(supabase);

  try {
    const scope = assertCampaignAccess(ctx);
    const campaigns = await listDocumentCampaigns(supabase, {
      organizationId: scope.organizationId,
      userId: user.id,
    });
    return successResponse({ campaigns });
  } catch (error) {
    if (error instanceof CampaignAccessError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("캠페인 목록을 불러오지 못했습니다.", 500);
  }
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = campaignCreateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  const ctx = await getSubscriberContext(supabase);

  try {
    const scope = assertCampaignAccess(ctx);
    const campaign = await createDocumentCampaign(supabase, {
      userId: user.id,
      organizationId: scope.organizationId,
      title: parsed.data.title,
      taxType: parsed.data.taxType,
      memo: parsed.data.memo,
      seasonPresetId: parsed.data.seasonPresetId,
      submissionDeadlineLabel: parsed.data.submissionDeadlineLabel,
      clientIds: parsed.data.clientIds,
    });
    return successResponse({ campaign });
  } catch (error) {
    if (error instanceof CampaignAccessError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(
      error instanceof Error ? error.message : "캠페인 생성에 실패했습니다.",
      500,
    );
  }
}
