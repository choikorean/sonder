import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import {
  ClientGenerationError,
  resolveClientForGeneration,
} from "@/lib/clients";
import { getHistory } from "@/lib/history";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const ctx = await getSubscriberContext(supabase);
  const clientIdParam = request.nextUrl.searchParams.get("clientId");

  let clientId: string | undefined;
  if (clientIdParam) {
    if (!ctx.capabilities.clientProfiles) {
      return errorResponse(
        "고객별 이력 조회는 Pro·Team 요금제(또는 무료 체험)에서 이용할 수 있습니다.",
        403,
      );
    }

    try {
      const resolved = await resolveClientForGeneration(supabase, {
        capabilities: ctx.capabilities,
        subscription: ctx.subscription,
        organizationId: ctx.organization?.id,
        clientId: clientIdParam,
      });
      clientId = resolved.clientId ?? undefined;
    } catch (err) {
      if (err instanceof ClientGenerationError) {
        return errorResponse(err.message, err.status);
      }
      throw err;
    }
  }

  const data = await getHistory(supabase, {
    retentionDays: ctx.retentionDays,
    clientId,
  });

  return successResponse({
    ...data,
    retentionDays: ctx.retentionDays,
    clientId: clientId ?? null,
    capabilities: {
      reviewSummary: ctx.capabilities.reviewSummary,
      fullConsultationOutput: ctx.capabilities.fullConsultationOutput,
      clientProfiles: ctx.capabilities.clientProfiles,
    },
  });
}
