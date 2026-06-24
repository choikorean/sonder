import {
  TAX_TYPE_LABELS,
  BUSINESS_TYPE_LABELS,
  type TaxType,
  type BusinessType,
} from "@/lib/constants";
import type { PromptClient } from "@/lib/prompt-client";
import type { PromptProfile } from "@/lib/subscriber-context";
import { getDocumentRequestDates } from "@/lib/document-request-dates";

export type PromptMessages = {
  system: string;
  user: string;
};

/** 모든 프롬프트에 공통으로 적용되는 규칙. */
const BASE_RULES = `당신은 한국 세무사 사무소의 문서 작성을 돕는 어시스턴트입니다.

반드시 지켜야 할 규칙:
- 결과물은 초안이며, 세무사가 검토 후 고객에게 전달합니다.
- 사용자가 제공하지 않은 사실(금액, 날짜, 거래 내용 등)을 임의로 만들어내지 마세요.
- 세법 해석이나 최종적인 세무·법률 판단을 제공하지 마세요.
- 한국어로 작성하고, 정중하고 전문적인 어조를 사용하세요.
- 마크다운 문법(**, *, #, \` 등)을 사용하지 마세요. 카카오톡·이메일에 바로 붙여넣을 수 있는 일반 텍스트만 사용하세요.
- 강조가 필요하면 「」표시, 번호·불릿 목록, 줄바꿈으로 구분하세요.`;

function profileBlock(profile?: PromptProfile | null): string {
  if (!profile) return "";
  const lines: string[] = [];
  if (profile.officeName?.trim()) {
    lines.push(`- 사무소명: ${profile.officeName.trim()}`);
  }
  if (profile.contactName?.trim()) {
    lines.push(`- 담당 세무사: ${profile.contactName.trim()}`);
  }
  if (profile.phone?.trim()) {
    lines.push(`- 연락처: ${profile.phone.trim()}`);
  }
  if (profile.email?.trim()) {
    lines.push(`- 이메일: ${profile.email.trim()}`);
  }
  if (lines.length === 0) return "";
  return `\n\n발신자 정보(본문·맺음말에 반드시 반영):\n${lines.join("\n")}`;
}

function phraseBlock(phrases?: string[]): string {
  if (!phrases?.length) return "";
  return `\n\n아래 문구 중 맥락에 맞는 표현을 참고해 자연스럽게 활용할 수 있습니다:\n${phrases.map((p) => `- ${p}`).join("\n")}`;
}

function clientBlock(client?: PromptClient | null): string {
  if (!client?.name?.trim()) return "";
  const lines = [`- 고객명(상호): ${client.name.trim()}`];
  if (client.contactName?.trim()) {
    lines.push(`- 담당자: ${client.contactName.trim()}`);
  }
  if (client.businessType) {
    lines.push(`- 사업 유형: ${BUSINESS_TYPE_LABELS[client.businessType]}`);
  }
  if (client.memo?.trim()) {
    lines.push(
      `- 고객 관련 메모(제공된 사실만 활용): ${client.memo.trim()}`,
    );
  }
  return `\n\n수신 고객 정보(인사말·호칭에 반드시 반영, 없는 정보는 추측하지 마세요):\n${lines.join("\n")}`;
}

function clientRule(client?: PromptClient | null): string {
  if (!client) return "";
  return "- 수신 고객 정보가 제공된 경우 인사말에서 고객명(상호)을 정확히 사용하세요. 담당자명이 있으면 적절히 호칭하세요. 고객 관련 메모는 제공된 내용만 반영하세요.";
}

export function buildDocumentRequestPrompt(input: {
  taxType: TaxType;
  businessType: BusinessType;
  memo?: string | null;
  includeRerequest?: boolean;
  profile?: PromptProfile | null;
  phrases?: string[];
  client?: PromptClient | null;
  requestDate?: string;
  submissionDeadline?: string;
}): PromptMessages {
  const taxLabel = TAX_TYPE_LABELS[input.taxType];
  const businessLabel = BUSINESS_TYPE_LABELS[input.businessType];
  const dates = getDocumentRequestDates();
  const requestDate = input.requestDate ?? dates.requestDate;
  const submissionDeadline =
    input.submissionDeadline ?? dates.submissionDeadline;

  const rerequestRule = input.includeRerequest
    ? "- 마지막에는 \"자료 미제출 시 사용할 수 있는 정중한 재요청 문구\"를 별도 섹션(예: [재요청 문구])으로 함께 제시하세요."
    : "";

  const profileRule = input.profile
    ? "- 발신자 정보가 제공된 경우 사무소명·담당자명·연락처를 본문과 맺음말에 정확히 반영하세요. 다른 이름이나 사무소명을 임의로 만들지 마세요."
    : "";

  const clientRuleText = clientRule(input.client);

  const system = `${BASE_RULES}

작업: 세무사 사무소가 거래처(고객)에게 보내는 "자료 요청문"을 작성합니다.

작성 지침:
- 카카오톡이나 이메일로 바로 보낼 수 있는 형태로 작성하세요.
- 다음 순서로 구성하세요: 인사말 → 요청 목적 → 필요한 자료 목록(항목별 정리) → 누락되기 쉬운 자료 안내 → 제출 기한 안내 → 맺음말.
- 세목과 사업 유형에 일반적으로 필요한 자료를 제시하되, 단정적인 세무 판단은 피하세요.
- 항목은 번호나 불릿으로 읽기 쉽게 정리하세요.
- 해당 세목·사업 유형에서 특히 누락되기 쉬운 자료를 별도로 짚어 안내하세요.
- 날짜 안내 규칙: 아래 사용자 조건에 제공된 '안내 기준일(요청일)'과 '자료 제출 기한'만 사용하세요.
- 안내 기준일은 문서 작성일이며, 자료 제출 기한은 그 이후 날짜입니다. 과거 일자로 안내하지 마세요.
- 신고기한·과세기간·제출마감일 등 구체적 과거 날짜는 사용자가 제공하지 않았다면 임의로 적지 마세요.
${rerequestRule}
${profileRule}
${clientRuleText}${profileBlock(input.profile)}${clientBlock(input.client)}${phraseBlock(input.phrases)}`;

  const user = `다음 조건으로 자료 요청문을 작성해 주세요.

- 세목: ${taxLabel}
- 사업 유형: ${businessLabel}
- 안내 기준일(요청일): ${requestDate}
- 자료 제출 기한: ${submissionDeadline}
- 특이사항: ${input.memo?.trim() || "없음"}`;

  return { system, user };
}

export function buildConsultationSummaryPrompt(input: {
  text: string;
  fullConsultationOutput?: boolean;
  profile?: PromptProfile | null;
  phrases?: string[];
  client?: PromptClient | null;
}): PromptMessages {
  const full = input.fullConsultationOutput !== false;

  const jsonSchema = full
    ? `{
  "summary": "세무사 내부용 핵심 요약",
  "clientSummary": "고객에게 전달할 수 있는 정중한 정리문",
  "requiredDocuments": "고객이 추가로 준비/제출해야 할 자료 목록 (없으면 '해당 없음')",
  "nextActions": "세무사·사무소가 내부적으로 수행할 후속 조치 목록 (없으면 '해당 없음')",
  "nextGuidance": "고객에게 안내할 다음 일정·절차 등 안내 사항 (없으면 '해당 없음')"
}`
    : `{
  "summary": "세무사 내부용 핵심 요약",
  "nextActions": "세무사·사무소가 내부적으로 수행할 후속 조치 목록 (없으면 '해당 없음')"
}`;

  const fullGuidance = full
    ? `- nextActions(내부 후속 조치)와 nextGuidance(고객 대상 다음 안내)를 혼동하지 말고 구분해 작성하세요.
- clientSummary에는 발신자 정보가 제공된 경우 맺음말에 사무소명·담당자명·연락처를 포함할 수 있습니다.
${clientRule(input.client)}`
    : `- Starter 플랜: 세무사 내부용 요약과 내부 후속 조치만 작성하세요. 고객 전달용 문구는 작성하지 마세요.`;

  const system = `${BASE_RULES}

작업: 세무 상담 내용을 분석해 구조화된 요약을 작성합니다.

반드시 아래 키를 가진 JSON 객체로만 응답하세요. 추가 설명이나 마크다운은 포함하지 마세요.
${jsonSchema}

지침:
- 상담 내용에 없는 사실을 추가하지 마세요.
- 목록형 항목은 줄바꿈으로 구분하세요.
${fullGuidance}
- 모든 JSON 문자열 값은 마크다운 없이 일반 텍스트만 사용하세요.${profileBlock(input.profile)}${clientBlock(input.client)}${phraseBlock(input.phrases)}`;

  const user = `다음 상담 내용을 분석해 JSON으로 요약해 주세요.

---
${input.text.trim()}
---`;

  return { system, user };
}

export function buildTaxExplanationPrompt(input: {
  taxType: TaxType;
  currentTax: number;
  previousTax?: number | null;
  changeReason?: string | null;
  dueDate?: string | null;
  memo?: string | null;
  profile?: PromptProfile | null;
  phrases?: string[];
  client?: PromptClient | null;
}): PromptMessages {
  const taxLabel = TAX_TYPE_LABELS[input.taxType];

  const system = `${BASE_RULES}

작업: 세무사가 고객에게 신고 결과를 안내하는 "설명문"을 작성합니다.

작성 지침:
- 전문 용어는 최소화하고, 일반 고객이 이해하기 쉽게 설명하세요.
- 이번 신고 세액을 안내하고, 이전 세액 정보가 있으면 변동(증가/감소)과 그 사유를 자연스럽게 설명하세요.
- 제공된 금액과 사유만 사용하고, 수치를 임의로 계산하거나 추정하지 마세요.
- 납부기한이 제공된 경우 마지막에 납부기한 안내를 포함하세요. 제공되지 않았다면 납부기한을 임의로 만들지 마세요.
- 카카오톡이나 이메일로 바로 보낼 수 있는 형태로 작성하세요.
- 발신자 정보가 제공된 경우 맺음말에 사무소명·담당자명·연락처를 정중하게 포함하세요.
${clientRule(input.client)}${profileBlock(input.profile)}${clientBlock(input.client)}${phraseBlock(input.phrases)}`;

  const lines = [
    `- 세목: ${taxLabel}`,
    `- 이번 신고 세액: ${input.currentTax.toLocaleString()}원`,
  ];

  if (input.previousTax != null) {
    lines.push(`- 이전 신고 세액: ${input.previousTax.toLocaleString()}원`);
  }
  if (input.changeReason?.trim()) {
    lines.push(`- 변동 사유: ${input.changeReason.trim()}`);
  }
  if (input.dueDate?.trim()) {
    lines.push(`- 납부기한: ${input.dueDate.trim()}`);
  }
  if (input.memo?.trim()) {
    lines.push(`- 특이사항: ${input.memo.trim()}`);
  }

  const user = `다음 정보를 바탕으로 고객 설명문을 작성해 주세요.

${lines.join("\n")}`;

  return { system, user };
}
