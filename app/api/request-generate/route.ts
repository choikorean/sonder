import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { requestGenerateSchema, firstZodErrorMessage } from "@/lib/validators";
import { buildDocumentRequestPrompt } from "@/lib/prompts";
import {
  getOpenAIClient,
  OPENAI_MODEL,
  OPENAI_TEMPERATURE,
} from "@/lib/openai";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUsageStatus, recordUsage, usageLimitMessage } from "@/lib/usage";

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

  const { taxType, businessType, memo } = parsed.data;

  const usage = await getUsageStatus(supabase);
  if (!usage.allowed) {
    return errorResponse(usageLimitMessage(usage.plan), 429);
  }

  let result: string;
  let tokensEstimated: number | null = null;
  try {
    const openai = getOpenAIClient();
    const { system, user: userPrompt } = buildDocumentRequestPrompt({
      taxType,
      businessType,
      memo,
    });

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: OPENAI_TEMPERATURE,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    });

    result = completion.choices[0]?.message?.content?.trim() ?? "";
    tokensEstimated = completion.usage?.total_tokens ?? null;
    if (!result) {
      throw new Error("빈 응답");
    }
  } catch {
    return errorResponse("AI 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.", 502);
  }

  const { data: saved, error: dbError } = await supabase
    .from("request_generations")
    .insert({
      user_id: user.id,
      tax_type: taxType,
      business_type: businessType,
      memo: memo ?? null,
      result,
    })
    .select("id")
    .single();

  if (dbError) {
    return errorResponse("결과 저장에 실패했습니다.", 500);
  }

  await recordUsage(supabase, user.id, "request_generation", tokensEstimated);

  return successResponse({ id: saved.id, result });
}
