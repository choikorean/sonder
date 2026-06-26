import "server-only";

import type { BusinessType, TaxType } from "@/lib/constants";
import {
  ClientGenerationError,
  mergeGenerationMemo,
  resolveClientForGeneration,
} from "@/lib/clients";
import type { PromptClient } from "@/lib/prompt-client";
import {
  buildDocumentRequestPrompt,
  buildDocumentRerequestPrompt,
  buildDocumentExplanationPrompt,
} from "@/lib/prompts";
import {
  getOpenAIClient,
  OPENAI_MODEL,
  OPENAI_TEMPERATURE,
} from "@/lib/openai";
import { toPlainClientText } from "@/lib/plain-text";
import { getPhraseContentsForPrompt } from "@/lib/saved-phrases";
import type { SubscriberContext } from "@/lib/subscriber-context";
import { getTaxSchedulePromptBlock } from "@/lib/tax-schedule/prompt-context";
import { getUsageStatus, recordUsage, formatUsageLimitMessage } from "@/lib/usage";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export class DocumentGenerationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type GenerateDocumentRequestInput = {
  supabase: SupabaseServer;
  userId: string;
  ctx: SubscriberContext;
  taxType: TaxType;
  businessType: BusinessType;
  memo?: string | null;
  clientId?: string | null;
  campaignItemId?: string | null;
  submissionDeadlineLabel?: string | null;
  requestDateLabel?: string | null;
  includeRerequest?: boolean;
  includeDocumentRationale?: boolean;
};

export type GenerateDocumentRerequestInput = {
  supabase: SupabaseServer;
  userId: string;
  ctx: SubscriberContext;
  taxType: TaxType;
  businessType: BusinessType;
  missingItems: string[];
  memo?: string | null;
  clientId?: string | null;
  campaignItemId?: string | null;
  submissionDeadlineLabel?: string | null;
  requestDateLabel?: string | null;
  includeDocumentRationale?: boolean;
};

async function resolvePromptClient(
  supabase: SupabaseServer,
  ctx: SubscriberContext,
  clientId?: string | null,
): Promise<{ clientId: string | null; client: PromptClient | null }> {
  try {
    const resolved = await resolveClientForGeneration(supabase, {
      capabilities: ctx.capabilities,
      subscription: ctx.subscription,
      organizationId: ctx.organization?.id,
      clientId,
    });
    return {
      clientId: resolved.clientId,
      client: resolved.client,
    };
  } catch (err) {
    if (err instanceof ClientGenerationError) {
      throw new DocumentGenerationError(err.message, err.status);
    }
    throw err;
  }
}

async function assertUsageAllowed(supabase: SupabaseServer) {
  const usage = await getUsageStatus(supabase);
  if (!usage.allowed) {
    throw new DocumentGenerationError(formatUsageLimitMessage(usage), 429);
  }
  return usage;
}

async function runOpenAIGeneration(system: string, userPrompt: string) {
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: OPENAI_TEMPERATURE,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
  });

  const result = toPlainClientText(
    completion.choices[0]?.message?.content?.trim() ?? "",
  );
  if (!result) {
    throw new DocumentGenerationError(
      "AI 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      502,
    );
  }

  return {
    result,
    tokensEstimated: completion.usage?.total_tokens ?? null,
  };
}

export async function generateDocumentRequest(
  input: GenerateDocumentRequestInput,
): Promise<{ id: string; result: string }> {
  await assertUsageAllowed(input.supabase);

  const { clientId, client } = await resolvePromptClient(
    input.supabase,
    input.ctx,
    input.clientId,
  );
  const effectiveMemo = mergeGenerationMemo(input.memo, client?.memo);
  const phrases = await getPhraseContentsForPrompt(input.supabase, input.ctx.capabilities, {
    organizationId: input.ctx.organization?.id,
  });
  const scheduleContext = await getTaxSchedulePromptBlock(input.supabase, {
    taxType: input.taxType,
    withinDays: 45,
  });

  const { system, user: userPrompt } = buildDocumentRequestPrompt({
    taxType: input.taxType,
    businessType: input.businessType,
    memo: effectiveMemo,
    includeRerequest: input.includeRerequest ?? input.ctx.capabilities.rerequestSection,
    profile: input.ctx.capabilities.officeSignature ? input.ctx.profile : null,
    phrases,
    client,
    requestDate: input.requestDateLabel ?? undefined,
    submissionDeadline: input.submissionDeadlineLabel ?? undefined,
    scheduleContext,
    includeDocumentRationale: input.includeDocumentRationale,
  });

  let generated: { result: string; tokensEstimated: number | null };
  try {
    generated = await runOpenAIGeneration(system, userPrompt);
  } catch (err) {
    if (err instanceof DocumentGenerationError) throw err;
    throw new DocumentGenerationError(
      "AI 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      502,
    );
  }

  const { data: saved, error: dbError } = await input.supabase
    .from("request_generations")
    .insert({
      user_id: input.userId,
      tax_type: input.taxType,
      business_type: input.businessType,
      memo: effectiveMemo,
      client_id: clientId,
      campaign_item_id: input.campaignItemId ?? null,
      result: generated.result,
    })
    .select("id")
    .single();

  if (dbError || !saved) {
    throw new DocumentGenerationError("결과 저장에 실패했습니다.", 500);
  }

  await recordUsage(
    input.supabase,
    input.userId,
    "request_generation",
    generated.tokensEstimated,
  );

  return { id: saved.id, result: generated.result };
}

export async function generateDocumentRerequest(
  input: GenerateDocumentRerequestInput,
): Promise<{ id: string; result: string }> {
  if (input.missingItems.length === 0) {
    throw new DocumentGenerationError("미제출 자료를 1개 이상 입력해 주세요.", 400);
  }

  await assertUsageAllowed(input.supabase);

  const { clientId, client } = await resolvePromptClient(
    input.supabase,
    input.ctx,
    input.clientId,
  );
  const effectiveMemo = mergeGenerationMemo(input.memo, client?.memo);
  const phrases = await getPhraseContentsForPrompt(input.supabase, input.ctx.capabilities, {
    organizationId: input.ctx.organization?.id,
  });
  const scheduleContext = await getTaxSchedulePromptBlock(input.supabase, {
    taxType: input.taxType,
    withinDays: 45,
  });

  const { system, user: userPrompt } = buildDocumentRerequestPrompt({
    taxType: input.taxType,
    businessType: input.businessType,
    missingItems: input.missingItems,
    memo: effectiveMemo,
    profile: input.ctx.capabilities.officeSignature ? input.ctx.profile : null,
    phrases,
    client,
    requestDate: input.requestDateLabel ?? undefined,
    submissionDeadline: input.submissionDeadlineLabel ?? undefined,
    scheduleContext,
    includeDocumentRationale: input.includeDocumentRationale,
  });

  let generated: { result: string; tokensEstimated: number | null };
  try {
    generated = await runOpenAIGeneration(system, userPrompt);
  } catch (err) {
    if (err instanceof DocumentGenerationError) throw err;
    throw new DocumentGenerationError(
      "AI 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      502,
    );
  }

  const { data: saved, error: dbError } = await input.supabase
    .from("request_generations")
    .insert({
      user_id: input.userId,
      tax_type: input.taxType,
      business_type: input.businessType,
      memo: effectiveMemo,
      client_id: clientId,
      campaign_item_id: input.campaignItemId ?? null,
      result: generated.result,
    })
    .select("id")
    .single();

  if (dbError || !saved) {
    throw new DocumentGenerationError("결과 저장에 실패했습니다.", 500);
  }

  await recordUsage(
    input.supabase,
    input.userId,
    "request_generation",
    generated.tokensEstimated,
  );

  return { id: saved.id, result: generated.result };
}

export type GenerateDocumentExplanationInput = {
  supabase: SupabaseServer;
  userId: string;
  ctx: SubscriberContext;
  taxType: TaxType;
  documentItems: string[];
  businessType?: BusinessType | null;
  customerQuestion?: string | null;
  memo?: string | null;
  clientId?: string | null;
};

export async function generateDocumentExplanation(
  input: GenerateDocumentExplanationInput,
): Promise<{ id: string; result: string }> {
  if (input.documentItems.length === 0) {
    throw new DocumentGenerationError("자료 항목을 1개 이상 입력해 주세요.", 400);
  }

  await assertUsageAllowed(input.supabase);

  const { clientId, client } = await resolvePromptClient(
    input.supabase,
    input.ctx,
    input.clientId,
  );
  const effectiveMemo = mergeGenerationMemo(input.memo, client?.memo);
  const phrases = await getPhraseContentsForPrompt(input.supabase, input.ctx.capabilities, {
    organizationId: input.ctx.organization?.id,
  });
  const scheduleContext = await getTaxSchedulePromptBlock(input.supabase, {
    taxType: input.taxType,
    withinDays: 45,
  });

  const businessType =
    input.businessType ??
    (client?.businessType ? resolveBusinessTypeForClient(client.businessType) : null);

  const { system, user: userPrompt } = buildDocumentExplanationPrompt({
    taxType: input.taxType,
    documentItems: input.documentItems,
    customerQuestion: input.customerQuestion,
    businessType,
    memo: effectiveMemo,
    profile: input.ctx.capabilities.officeSignature ? input.ctx.profile : null,
    phrases,
    client,
    scheduleContext,
  });

  let generated: { result: string; tokensEstimated: number | null };
  try {
    generated = await runOpenAIGeneration(system, userPrompt);
  } catch (err) {
    if (err instanceof DocumentGenerationError) throw err;
    throw new DocumentGenerationError(
      "AI 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      502,
    );
  }

  const documentItemsText = input.documentItems.join("\n");

  const { data: saved, error: dbError } = await input.supabase
    .from("document_explanations")
    .insert({
      user_id: input.userId,
      client_id: clientId,
      tax_type: input.taxType,
      business_type: businessType,
      document_items: documentItemsText,
      customer_question: input.customerQuestion ?? null,
      memo: effectiveMemo,
      result: generated.result,
    })
    .select("id")
    .single();

  if (dbError || !saved) {
    throw new DocumentGenerationError("결과 저장에 실패했습니다.", 500);
  }

  await recordUsage(
    input.supabase,
    input.userId,
    "request_generation",
    generated.tokensEstimated,
  );

  return { id: saved.id, result: generated.result };
}

export function parseDocumentItems(value: string): string[] {
  return parseMissingItems(value);
}

export function parseMissingItems(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveBusinessTypeForClient(
  businessType: string | null | undefined,
): BusinessType {
  const allowed = [
    "SOLE",
    "CORPORATION",
    "FREELANCER",
    "ECOMMERCE",
    "RESTAURANT",
    "SERVICE",
    "ETC",
  ] as const;
  if (businessType && allowed.includes(businessType as BusinessType)) {
    return businessType as BusinessType;
  }
  return "ETC";
}
