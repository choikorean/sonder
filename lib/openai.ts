import "server-only";

import OpenAI from "openai";

let client: OpenAI | null = null;

/**
 * 서버 전용 OpenAI 클라이언트. 클라이언트 컴포넌트에서 import 하면
 * `server-only` 패키지가 빌드 단계에서 에러를 발생시킵니다.
 */
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

export const OPENAI_TRANSCRIBE_MODEL =
  process.env.OPENAI_TRANSCRIBE_MODEL ?? "whisper-1";

/** 일관된 출력을 위한 기본 temperature (PRD: 0.3) */
export const OPENAI_TEMPERATURE = 0.3;
