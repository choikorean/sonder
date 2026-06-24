import type { PlanId } from "@/lib/plans";

/** 플랜별 실제 제공 기능(코드에서 enforce) */
export type PlanCapabilities = {
  /** 누락자료 재요청문(자료 요청 프롬프트에 포함) */
  rerequestSection: boolean;
  /** 상담 고객 전달용 정리문 등 전체 상담 출력 */
  fullConsultationOutput: boolean;
  /** 생성 결과에 사무소명·담당자명 서명 삽입 */
  officeSignature: boolean;
  /** 자주 쓰는 문구 저장·삽입 */
  savedPhrases: boolean;
  /** 사무소 공통 템플릿(문구 scope=office) */
  officeSharedPhrases: boolean;
  /** 카톡/이메일 복사 포맷 */
  copyFormats: boolean;
  /** 생성 내역 대표 검토용 정리 */
  reviewSummary: boolean;
  /** 우선 이메일 지원 안내 */
  prioritySupport: boolean;
};

const STARTER_CAPABILITIES: PlanCapabilities = {
  rerequestSection: true,
  fullConsultationOutput: true,
  officeSignature: false,
  savedPhrases: false,
  officeSharedPhrases: false,
  copyFormats: false,
  reviewSummary: false,
  prioritySupport: false,
};

const PRO_CAPABILITIES: PlanCapabilities = {
  rerequestSection: true,
  fullConsultationOutput: true,
  officeSignature: true,
  savedPhrases: true,
  officeSharedPhrases: false,
  copyFormats: true,
  reviewSummary: false,
  prioritySupport: true,
};

const TEAM_CAPABILITIES: PlanCapabilities = {
  ...PRO_CAPABILITIES,
  officeSharedPhrases: true,
  reviewSummary: true,
  prioritySupport: true,
};

const PLAN_CAPABILITIES: Record<PlanId, PlanCapabilities> = {
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
  copyFormats: true,
  reviewSummary: true,
  prioritySupport: true,
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
