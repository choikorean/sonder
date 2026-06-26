import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import {
  DocumentGenerationError,
  generateDocumentExplanation,
  parseDocumentItems,
} from "@/lib/document-campaign/generate";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getSubscriberContext } from "@/lib/subscriber-context";
import {
  documentExplanationSchema,
  firstZodErrorMessage,
} from "@/lib/validators";

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

  const parsed = documentExplanationSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  const documentItems = Array.isArray(parsed.data.documentItems)
    ? parsed.data.documentItems
    : parseDocumentItems(parsed.data.documentItems);

  const ctx = await getSubscriberContext(supabase);

  try {
    const result = await generateDocumentExplanation({
      supabase,
      userId: user.id,
      ctx,
      taxType: parsed.data.taxType,
      businessType: parsed.data.businessType,
      documentItems,
      customerQuestion: parsed.data.customerQuestion,
      memo: parsed.data.memo,
      clientId: parsed.data.clientId,
    });

    return successResponse({
      id: result.id,
      result: result.result,
    });
  } catch (error) {
    if (error instanceof DocumentGenerationError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("자료 설명문 생성에 실패했습니다.", 502);
  }
}
