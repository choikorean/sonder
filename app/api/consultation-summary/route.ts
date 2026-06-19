import { type NextRequest } from "next/server";
import { toFile } from "openai";

import { getAuthContext } from "@/lib/auth";
import {
  consultationSummarySchema,
  firstZodErrorMessage,
} from "@/lib/validators";
import { buildConsultationSummaryPrompt } from "@/lib/prompts";
import {
  getOpenAIClient,
  OPENAI_MODEL,
  OPENAI_TEMPERATURE,
  OPENAI_TRANSCRIBE_MODEL,
} from "@/lib/openai";
import { successResponse, errorResponse } from "@/lib/api-response";
import { AUDIO_MAX_BYTES, AUDIO_ALLOWED_MIME_TYPES } from "@/lib/constants";

const AUDIO_BUCKET = "consultation-audio";

type SummaryFields = {
  summary: string;
  clientSummary: string;
  requiredDocuments: string;
  nextActions: string;
};

async function summarize(text: string): Promise<SummaryFields> {
  const openai = getOpenAIClient();
  const { system, user } = buildConsultationSummaryPrompt({ text });

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

  return {
    summary: String(parsed.summary ?? "").trim(),
    clientSummary: String(parsed.clientSummary ?? "").trim(),
    requiredDocuments: String(parsed.requiredDocuments ?? "").trim(),
    nextActions: String(parsed.nextActions ?? "").trim(),
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

  const contentType = request.headers.get("content-type") ?? "";

  let sourceText = "";
  let originalText: string | null = null;
  let transcript: string | null = null;
  let audioUrl: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    // 오디오 또는 텍스트 입력
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse("요청 형식이 올바르지 않습니다.", 400);
    }

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
      const parsed = consultationSummarySchema.safeParse({ text });
      if (!parsed.success) {
        return errorResponse(firstZodErrorMessage(parsed.error), 400);
      }
      originalText = parsed.data.text;
      sourceText = parsed.data.text;
    } else {
      return errorResponse("상담 메모 또는 오디오 파일을 입력해 주세요.", 400);
    }
  } else {
    // JSON 텍스트 입력
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
  }

  let fields: SummaryFields;
  try {
    fields = await summarize(sourceText);
    if (!fields.summary || !fields.clientSummary) {
      throw new Error("요약 결과 누락");
    }
  } catch {
    return errorResponse("AI 요약에 실패했습니다. 잠시 후 다시 시도해 주세요.", 502);
  }

  const { data: saved, error: dbError } = await supabase
    .from("consultation_summaries")
    .insert({
      user_id: user.id,
      audio_url: audioUrl,
      original_text: originalText,
      transcript,
      summary: fields.summary,
      client_summary: fields.clientSummary,
      required_documents: fields.requiredDocuments || null,
      next_actions: fields.nextActions || null,
    })
    .select("id")
    .single();

  if (dbError) {
    return errorResponse("결과 저장에 실패했습니다.", 500);
  }

  return successResponse({
    id: saved.id,
    transcript,
    summary: fields.summary,
    clientSummary: fields.clientSummary,
    requiredDocuments: fields.requiredDocuments,
    nextActions: fields.nextActions,
  });
}
