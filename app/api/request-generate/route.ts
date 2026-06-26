import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import {
  DocumentGenerationError,
  generateDocumentRequest,
} from "@/lib/document-campaign/generate";
import { requestGenerateSchema, firstZodErrorMessage } from "@/lib/validators";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSubscriberContext } from "@/lib/subscriber-context";

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

  const parsed = requestGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  const { taxType, businessType, memo, clientId } = parsed.data;
  const ctx = await getSubscriberContext(supabase);

  try {
    const result = await generateDocumentRequest({
      supabase,
      userId: user.id,
      ctx,
      taxType,
      businessType,
      memo,
      clientId,
      includeRerequest: ctx.capabilities.rerequestSection,
      includeDocumentRationale: parsed.data.includeDocumentRationale,
    });

    return successResponse({
      id: result.id,
      result: result.result,
    });
  } catch (error) {
    if (error instanceof DocumentGenerationError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("AI 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.", 502);
  }
}
