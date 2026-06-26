import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import {
  DocumentGenerationError,
  generateDocumentRerequest,
  parseMissingItems,
  resolveBusinessTypeForClient,
} from "@/lib/document-campaign/generate";
import {
  assertCampaignAccess,
  CampaignAccessError,
  getCampaignItemForGeneration,
  markCampaignItemRequested,
  updateCampaignItemStatus,
} from "@/lib/document-campaign/service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { firstZodErrorMessage, requestRerequestSchema } from "@/lib/validators";

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

  const parsed = requestRerequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  const ctx = await getSubscriberContext(supabase);

  try {
    assertCampaignAccess(ctx);

    const missingItems = Array.isArray(parsed.data.missingItems)
      ? parsed.data.missingItems
      : parseMissingItems(parsed.data.missingItems);

    let businessType = parsed.data.businessType;
    let clientId = parsed.data.clientId ?? null;
    let campaignItemId = parsed.data.campaignItemId ?? null;
    let submissionDeadlineLabel = parsed.data.submissionDeadlineLabel ?? null;
    let memo = parsed.data.memo ?? null;

    if (campaignItemId) {
      const linked = await getCampaignItemForGeneration(supabase, campaignItemId);
      if (!linked) {
        return errorResponse("캠페인 고객 정보를 찾을 수 없습니다.", 404);
      }
      clientId = linked.item.clientId;
      businessType =
        businessType ??
        resolveBusinessTypeForClient(linked.item.clientBusinessType);
      submissionDeadlineLabel =
        submissionDeadlineLabel ?? linked.campaign.submissionDeadlineLabel;
      memo = memo ?? linked.campaign.memo;
    }

    if (!businessType && clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("business_type")
        .eq("id", clientId)
        .maybeSingle();
      businessType = resolveBusinessTypeForClient(client?.business_type);
    }

    if (!businessType) {
      return errorResponse("사업 유형을 확인할 수 없습니다.", 400);
    }

    const result = await generateDocumentRerequest({
      supabase,
      userId: user.id,
      ctx,
      taxType: parsed.data.taxType,
      businessType,
      missingItems,
      memo,
      clientId,
      campaignItemId,
      submissionDeadlineLabel,
    });

    if (campaignItemId) {
      await markCampaignItemRequested(
        supabase,
        campaignItemId,
        result.id,
        "rerequest",
      );
      await updateCampaignItemStatus(
        supabase,
        campaignItemId,
        "requested",
        missingItems.join("\n"),
      );
    }

    return successResponse({
      id: result.id,
      result: result.result,
    });
  } catch (error) {
    if (error instanceof CampaignAccessError) {
      return errorResponse(error.message, error.status);
    }
    if (error instanceof DocumentGenerationError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("재요청문 생성에 실패했습니다.", 500);
  }
}
