import type { PlanId } from "@/lib/plans";

/**
 * 플랜별 실제 제공 기능 — API·UI에서 enforce 합니다.
 *
 * 요금제 문구(lib/plans.ts features[]) ↔ capability 매핑:
 *
 * | 요금제 문구                         | capability              | Starter | Pro | Team | 체험 |
 * |------------------------------------|-------------------------|---------|-----|------|------|
 * | 자료 요청·재요청문                  | rerequestSection        |   ✓     |  ✓  |  ✓   |  ✓   |
 * | 상담 메모 요약 (Starter)            | fullConsultationOutput  |   ✗     |  ✓  |  ✓   |  ✓   |
 * | 상담 요약 + 고객 전달용 (Pro+)      | fullConsultationOutput  |   ✗     |  ✓  |  ✓   |  ✓   |
 * | 사무소명/담당자명 자동 삽입         | officeSignature         |   ✗     |  ✓  |  ✓   |  ✓   |
 * | 자주 쓰는 문구 저장                 | savedPhrases            |   ✗     |  ✓  |  ✓   |  ✓   |
 * | 사무소 공통 템플릿 (Team)           | officeSharedPhrases     |   ✗     |  ✗  |  ✓   |  ✓   |
 * | 대표 검토용 결과 정리 (Team)        | reviewSummary           |   ✗     |  ✗  |  ✓   |  ✓   |
 * | 고객 등록·관리 (Pro 20 / Team 200)  | clientProfiles          |   ✗     |  ✓  |  ✓   |  ✓   |
 * | 월 N건 생성                         | plans.monthlyLimit      |  100    | 500 | 2000 |  30  |
 * | 생성 기록 N일 보관                  | plans.retentionDays     |   30    | 365 |  365 |  14  |
 * | N인 계정                            | plans.seats             |    1    |   1 |    5 |   1  |
 *
 * 한도·보관·좌석은 PlanCapabilities가 아닌 lib/plans.ts + subscriber-context에서 적용합니다.
 * 체험(trialing)은 TRIAL_CAPABILITIES(Pro+Team 기능 전체) + FREE_TRIAL 한도·보관만 제한합니다.
 */
export type PlanCapabilities = {
  /** 누락자료 재요청문(자료 요청 프롬프트에 포함) */
  rerequestSection: boolean;
  /** 상담 고객 전달용 정리문·추가자료·다음 안내 등 전체 상담 출력 (Starter는 내부 요약만) */
  fullConsultationOutput: boolean;
  /** 생성 결과에 사무소명·담당자명 서명 삽입 */
  officeSignature: boolean;
  /** 자주 쓰는 문구 저장·삽입 */
  savedPhrases: boolean;
  /** 사무소 공통 템플릿(문구 scope=office) */
  officeSharedPhrases: boolean;
  /** 생성 내역 대표 검토용 정리 */
  reviewSummary: boolean;
  /** 고객(CRM) 등록·관리 — Pro·Team·체험 */
  clientProfiles: boolean;
};

const STARTER_CAPABILITIES: PlanCapabilities = {
  rerequestSection: true,
  fullConsultationOutput: false,
  officeSignature: false,
  savedPhrases: false,
  officeSharedPhrases: false,
  reviewSummary: false,
  clientProfiles: false,
};

const PRO_CAPABILITIES: PlanCapabilities = {
  rerequestSection: true,
  fullConsultationOutput: true,
  officeSignature: true,
  savedPhrases: true,
  officeSharedPhrases: false,
  reviewSummary: false,
  clientProfiles: true,
};

const TEAM_CAPABILITIES: PlanCapabilities = {
  ...PRO_CAPABILITIES,
  officeSharedPhrases: true,
  reviewSummary: true,
};

const PLAN_CAPABILITIES: Record<PlanId, PlanCapabilities> = {
  /** 비체험 free(만료·미구독) — Starter와 동일 권한 */
  free: STARTER_CAPABILITIES,
  starter: STARTER_CAPABILITIES,
  pro: PRO_CAPABILITIES,
  team: TEAM_CAPABILITIES,
};

/** 무료 체험 중에는 건수·기간만 제한하고 Pro+Team 기능을 모두 제공 */
export const TRIAL_CAPABILITIES: PlanCapabilities = {
  rerequestSection: true,
  fullConsultationOutput: true,
  officeSignature: true,
  savedPhrases: true,
  officeSharedPhrases: true,
  reviewSummary: true,
  clientProfiles: true,
};

export function getPlanCapabilities(
  planId: PlanId,
  options?: { isTrialing?: boolean },
): PlanCapabilities {
  if (options?.isTrialing) {
    return TRIAL_CAPABILITIES;
  }
  return PLAN_CAPABILITIES[planId];
}

/** 생성 프롬프트에 사무소 프로필(이름·연락처)이 필요한지 */
export function needsPromptProfile(capabilities: PlanCapabilities): boolean {
  return capabilities.officeSignature;
}

/** 설정 화면에서 문구 저장·편집 기능을 쓸 수 있는지 */
export function canManagePhrases(capabilities: PlanCapabilities): boolean {
  return capabilities.savedPhrases || capabilities.officeSharedPhrases;
}

/** 고객(CRM) 등록·관리 화면/API 이용 가능 여부 */
export function canManageClients(capabilities: PlanCapabilities): boolean {
  return capabilities.clientProfiles;
}
