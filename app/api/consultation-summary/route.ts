import { type NextRequest } from "next/server";
import { toFile } from "openai";

import { getAuthContext } from "@/lib/auth";
import {
  ClientGenerationError,
  resolveClientForGeneration,
} from "@/lib/clients";
import {
  consultationSummarySchema,
  consultationClientIdSchema,
  firstZodErrorMessage,
} from "@/lib/validators";
import { buildConsultationSummaryPrompt } from "@/lib/prompts";
import type { PromptClient } from "@/lib/prompt-client";
import type { PromptProfile } from "@/lib/subscriber-context";
import {
  getOpenAIClient,
  OPENAI_MODEL,
  OPENAI_TEMPERATURE,
  OPENAI_TRANSCRIBE_MODEL,
} from "@/lib/openai";
import { successResponse, errorResponse } from "@/lib/api-response";
import { AUDIO_MAX_BYTES, AUDIO_ALLOWED_MIME_TYPES } from "@/lib/constants";
import { getUsageStatus, recordUsage, usageLimitMessage } from "@/lib/usage";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { getPhraseContentsForPrompt } from "@/lib/saved-phrases";
import { toPlainClientText } from "@/lib/plain-text";
import {
  toConsultationApiResponse,
  toConsultationDbInsert,
  type ConsultationFields,
} from "@/lib/consultation-output";

const AUDIO_BUCKET = "consultation-audio";

async function summarize(
  text: string,
  options: {
    fullConsultationOutput: boolean;
    profile?: PromptProfile | null;
    phrases?: string[];
    client?: PromptClient | null;
  },
): Promise<{ fields: ConsultationFields; tokens: number | null }> {
  const openai = getOpenAIClient();
  const { system, user } = buildConsultationSummaryPrompt({
    text,
    fullConsultationOutput: options.fullConsultationOutput,
    profile: options.profile,
    phrases: options.phrases,
    client: options.client,
  });

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: OPENAI_TEMPERATURE,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim() ?? "{}";
  const parsed = JSON.parse(content) as Record<string, unknown>;

  const summary = toPlainClientText(String(parsed.summary ?? "").trim());
  const nextActions = toPlainClientText(String(parsed.nextActions ?? "").trim());

  if (options.fullConsultationOutput) {
    return {
      fields: {
        summary,
        clientSummary: toPlainClientText(
          String(parsed.clientSummary ?? "").trim(),
        ),
        requiredDocuments: toPlainClientText(
          String(parsed.requiredDocuments ?? "").trim(),
        ),
        nextActions,
        nextGuidance: toPlainClientText(
          String(parsed.nextGuidance ?? "").trim(),
        ),
      },
      tokens: completion.usage?.total_tokens ?? null,
    };
  }

  return {
    fields: {
      summary,
      clientSummary: "",
      requiredDocuments: "",
      nextActions,
      nextGuidance: "",
    },
    tokens: completion.usage?.total_tokens ?? null,
  };
}

function sanitizeFileName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.length > 0 ? cleaned : "audio";
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const usage = await getUsageStatus(supabase);
  if (!usage.allowed) {
    return errorResponse(usageLimitMessage(usage.plan), 429);
  }

  const contentType = request.headers.get("content-type") ?? "";

  let sourceText = "";
  let originalText: string | null = null;
  let transcript: string | null = null;
  let audioUrl: string | null = null;
  let inputClientId: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse("요청 형식이 올바르지 않습니다.", 400);
    }

    const clientIdRaw = formData.get("clientId");
    const clientIdParsed = consultationClientIdSchema.safeParse({
      clientId:
        typeof clientIdRaw === "string" && clientIdRaw.trim()
          ? clientIdRaw.trim()
          : undefined,
    });
    if (!clientIdParsed.success) {
      return errorResponse(firstZodErrorMessage(clientIdParsed.error), 400);
    }
    inputClientId = clientIdParsed.data.clientId ?? undefined;

    const audio = formData.get("audio");
    const text = formData.get("text");

    if (audio instanceof File && audio.size > 0) {
      if (audio.size > AUDIO_MAX_BYTES) {
        return errorResponse("오디오 파일 크기는 25MB 이하여야 합니다.", 400);
      }
      if (
        !(AUDIO_ALLOWED_MIME_TYPES as readonly string[]).includes(audio.type)
      ) {
        return errorResponse(
          "지원하지 않는 오디오 형식입니다. mp3, m4a, wav, webm 파일을 올려주세요.",
          400,
        );
      }

      const buffer = Buffer.from(await audio.arrayBuffer());
      const path = `${user.id}/${Date.now()}-${sanitizeFileName(audio.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(path, buffer, { contentType: audio.type, upsert: false });

      if (uploadError) {
        return errorResponse("오디오 업로드에 실패했습니다.", 500);
      }
      audioUrl = path;

      try {
        const openai = getOpenAIClient();
        const uploadable = await toFile(buffer, sanitizeFileName(audio.name), {
          type: audio.type,
        });
        const transcription = await openai.audio.transcriptions.create({
          file: uploadable,
          model: OPENAI_TRANSCRIBE_MODEL,
        });
        transcript = transcription.text?.trim() ?? "";
      } catch {
        return errorResponse("음성 인식에 실패했습니다. 잠시 후 다시 시도해 주세요.", 502);
      }

      if (!transcript) {
        return errorResponse("음성에서 텍스트를 추출하지 못했습니다.", 422);
      }
      sourceText = transcript;
    } else if (typeof text === "string" && text.trim().length > 0) {
      const parsed = consultationSummarySchema.safeParse({
        text,
        clientId: inputClientId,
      });
      if (!parsed.success) {
        return errorResponse(firstZodErrorMessage(parsed.error), 400);
      }
      originalText = parsed.data.text;
      sourceText = parsed.data.text;
    } else {
      return errorResponse("상담 메모 또는 오디오 파일을 입력해 주세요.", 400);
    }
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("요청 형식이 올바르지 않습니다.", 400);
    }

    const parsed = consultationSummarySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(firstZodErrorMessage(parsed.error), 400);
    }
    originalText = parsed.data.text;
    sourceText = parsed.data.text;
    inputClientId = parsed.data.clientId ?? undefined;
  }

  const ctx = await getSubscriberContext(supabase);

  let resolvedClientId: string | null = null;
  let promptClient: PromptClient | null = null;
  try {
    const resolved = await resolveClientForGeneration(supabase, {
      capabilities: ctx.capabilities,
      subscription: ctx.subscription,
      organizationId: ctx.organization?.id,
      clientId: inputClientId,
    });
    resolvedClientId = resolved.clientId;
    promptClient = resolved.client;
  } catch (err) {
    if (err instanceof ClientGenerationError) {
      return errorResponse(err.message, err.status);
    }
    throw err;
  }

  const fullOutput = ctx.capabilities.fullConsultationOutput;
  const phrases = await getPhraseContentsForPrompt(supabase, ctx.capabilities, {
    organizationId: ctx.organization?.id,
  });

  let fields: ConsultationFields;
  let tokensEstimated: number | null = null;
  try {
    const result = await summarize(sourceText, {
      fullConsultationOutput: fullOutput,
      profile: ctx.capabilities.officeSignature ? ctx.profile : null,
      phrases,
      client: promptClient,
    });
    fields = result.fields;
    tokensEstimated = result.tokens;
    if (!fields.summary) {
      throw new Error("요약 결과 누락");
    }
    if (fullOutput && !fields.clientSummary) {
      throw new Error("고객 전달용 정리 누락");
    }
  } catch {
    return errorResponse("AI 요약에 실패했습니다. 잠시 후 다시 시도해 주세요.", 502);
  }

  const dbRow = toConsultationDbInsert(fields, fullOutput);

  const { data: saved, error: dbError } = await supabase
    .from("consultation_summaries")
    .insert({
      user_id: user.id,
      audio_url: audioUrl,
      original_text: originalText,
      transcript,
      client_id: resolvedClientId,
      ...dbRow,
    })
    .select("id")
    .single();

  if (dbError) {
    return errorResponse("결과 저장에 실패했습니다.", 500);
  }

  await recordUsage(supabase, user.id, "consultation_summary", tokensEstimated);

  const responseFields = toConsultationApiResponse(fields, fullOutput);

  return successResponse({
    id: saved.id,
    transcript,
    ...responseFields,
  });
}
