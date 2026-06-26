import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import {
  DocumentGenerationError,
  generateDocumentRequest,
  resolveBusinessTypeForClient,
} from "@/lib/document-campaign/generate";
import {
  assertCampaignAccess,
  CampaignAccessError,
  getDocumentCampaignDetail,
  markCampaignItemRequested,
} from "@/lib/document-campaign/service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { campaignGenerateSchema, firstZodErrorMessage } from "@/lib/validators";

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

  const parsed = campaignGenerateSchema.safeParse(body ?? {});
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

    let targetItems = campaign.items;
    if (parsed.data.itemIds?.length) {
      const idSet = new Set(parsed.data.itemIds);
      targetItems = campaign.items.filter((item) => idSet.has(item.id));
    } else if (parsed.data.onlyNotRequested !== false) {
      targetItems = campaign.items.filter(
        (item) => item.status === "not_requested",
      );
    }

    if (targetItems.length === 0) {
      return errorResponse("생성할 고객이 없습니다.", 400);
    }

    const generated: Array<{
      itemId: string;
      clientName: string;
      requestId: string;
      result: string;
    }> = [];
    const failed: Array<{ itemId: string; clientName: string; error: string }> =
      [];

    for (const item of targetItems) {
      try {
        const businessType = resolveBusinessTypeForClient(
          item.clientBusinessType,
        );
        const result = await generateDocumentRequest({
          supabase,
          userId: user.id,
          ctx,
          taxType: campaign.taxType,
          businessType,
          memo: campaign.memo,
          clientId: item.clientId,
          campaignItemId: item.id,
          submissionDeadlineLabel: campaign.submissionDeadlineLabel,
          includeRerequest: ctx.capabilities.rerequestSection,
        });

        await markCampaignItemRequested(supabase, item.id, result.id, "initial");

        generated.push({
          itemId: item.id,
          clientName: item.clientName,
          requestId: result.id,
          result: result.result,
        });
      } catch (error) {
        const message =
          error instanceof DocumentGenerationError
            ? error.message
            : "생성에 실패했습니다.";
        failed.push({
          itemId: item.id,
          clientName: item.clientName,
          error: message,
        });
        if (error instanceof DocumentGenerationError && error.status === 429) {
          break;
        }
      }
    }

    const updated = await getDocumentCampaignDetail(supabase, id);

    return successResponse({
      generated,
      failed,
      usageExceeded: failed.some((row) => row.error.includes("한도")),
      campaign: updated,
    });
  } catch (error) {
    if (error instanceof CampaignAccessError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("일괄 생성에 실패했습니다.", 500);
  }
}
