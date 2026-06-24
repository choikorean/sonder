import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import {
  reportExplanationSchema,
  firstZodErrorMessage,
} from "@/lib/validators";
import { buildTaxExplanationPrompt } from "@/lib/prompts";
import {
  getOpenAIClient,
  OPENAI_MODEL,
  OPENAI_TEMPERATURE,
} from "@/lib/openai";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUsageStatus, recordUsage, usageLimitMessage } from "@/lib/usage";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { getPhraseContentsForPrompt } from "@/lib/saved-phrases";

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

  const parsed = reportExplanationSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  const { taxType, currentTax, previousTax, changeReason, dueDate, memo } =
    parsed.data;

  const usage = await getUsageStatus(supabase);
  if (!usage.allowed) {
    return errorResponse(usageLimitMessage(usage.plan), 429);
  }

  const ctx = await getSubscriberContext(supabase);
  const phrases = await getPhraseContentsForPrompt(
    supabase,
    ctx.capabilities,
  );

  let result: string;
  let tokensEstimated: number | null = null;
  try {
    const openai = getOpenAIClient();
    const { system, user: userPrompt } = buildTaxExplanationPrompt({
      taxType,
      currentTax,
      previousTax,
      changeReason,
      dueDate,
      memo,
      profile: ctx.capabilities.officeSignature ? ctx.profile : null,
      phrases,
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
    .from("report_explanations")
    .insert({
      user_id: user.id,
      tax_type: taxType,
      current_tax: currentTax,
      previous_tax: previousTax ?? null,
      change_reason: changeReason ?? null,
      due_date: dueDate ?? null,
      memo: memo ?? null,
      result,
    })
    .select("id")
    .single();

  if (dbError) {
    return errorResponse("결과 저장에 실패했습니다.", 500);
  }

  await recordUsage(supabase, user.id, "report_explanation", tokensEstimated);

  return successResponse({
    id: saved.id,
    result,
    copyFormats: ctx.capabilities.copyFormats,
  });
}
