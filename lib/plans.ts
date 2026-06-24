export type PlanId = "free" | "starter" | "pro" | "team";
export type BillingCycle = "monthly" | "yearly";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** 월 결제 가격(원, 부가세 별도). free는 0 */
  monthlyPrice: number;
  /** 연 결제 가격(원, 부가세 별도) = 2개월 무료. free는 0 */
  yearlyPrice: number;
  /** 월 생성 한도(전체 기능 합산) */
  monthlyLimit: number;
  /** 포함 좌석 수 */
  seats: number;
  /** 생성 기록 보관 일수 */
  retentionDays: number;
  /** 마케팅 노출용 기능 목록 */
  features: string[];
  /** Pro 등 강조 플랜 여부 */
  highlight: boolean;
  /** 카드 배지 문구 (예: "가장 많이 선택") */
  badge?: string;
  /** 유료 결제 가능 플랜 여부 (free는 결제 불가) */
  purchasable: boolean;
};

export const FREE_TRIAL = {
  days: 14,
  generationLimit: 30,
  retentionDays: 14,
} as const;

/**
 * 플랜별 마케팅 기능 목록(features)은 lib/plan-capabilities.ts의
 * PlanCapabilities 및 monthlyLimit / retentionDays / seats와 1:1 대응합니다.
 * 실제 enforce는 getSubscriberContext() + 각 API에서 수행합니다.
 */
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "무료 체험",
    tagline: "신용카드 없이 14일",
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyLimit: FREE_TRIAL.generationLimit,
    seats: 1,
    retentionDays: FREE_TRIAL.retentionDays,
    features: [
      "Pro·Team 전체 기능 체험",
      "자료 요청·재요청문 생성",
      "상담 요약 + 고객 전달용 정리문",
      "신고 결과 설명문 생성",
      "사무소명/담당자명 자동 삽입",
      "자주 쓰는 문구·공통 템플릿",
      "카톡/이메일 복사 포맷",
      "14일간 생성 30건",
      "기록 14일 보관",
    ],
    highlight: false,
    purchasable: false,
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "1인 체험용",
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    monthlyLimit: 100,
    seats: 1,
    retentionDays: 30,
    features: [
      "자료 요청문 생성",
      "누락자료 재요청문 생성",
      "신고 결과 설명문 생성",
      "상담 메모 요약",
      "월 100건 생성",
      "생성 기록 30일 보관",
      "1인 계정",
    ],
    highlight: false,
    purchasable: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "개인 세무사 추천",
    monthlyPrice: 29000,
    yearlyPrice: 290000,
    monthlyLimit: 500,
    seats: 1,
    retentionDays: 365,
    features: [
      "자료 요청·재요청문 생성",
      "상담 요약 + 고객 전달용 정리문",
      "신고 결과 설명문 생성",
      "월 500건 생성",
      "생성 기록 1년 보관",
      "사무소명/담당자명 자동 삽입",
      "자주 쓰는 문구 저장",
      "카톡/이메일 복사 포맷",
      "우선 이메일 지원",
    ],
    highlight: true,
    badge: "가장 많이 선택",
    purchasable: true,
  },
  team: {
    id: "team",
    name: "Team",
    tagline: "세무법인·소형 사무소",
    monthlyPrice: 99000,
    yearlyPrice: 990000,
    monthlyLimit: 2000,
    seats: 5,
    retentionDays: 365,
    features: [
      "Pro 전체 기능",
      "최대 5인 계정",
      "월 2,000건 생성",
      "사용자별 생성 이력",
      "사무소 공통 템플릿",
      "대표 검토용 결과 정리",
      "우선 지원 + 온보딩 30분",
    ],
    highlight: false,
    purchasable: true,
  },
};

/** 랜딩/결제 페이지에 노출하는 유료 플랜 순서 */
export const PURCHASABLE_PLAN_IDS: PlanId[] = ["starter", "pro", "team"];

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

export function isPlanId(value: string): value is PlanId {
  return value === "free" || value === "starter" || value === "pro" || value === "team";
}

export function isBillingCycle(value: string): value is BillingCycle {
  return value === "monthly" || value === "yearly";
}

export function planPrice(plan: Plan, cycle: BillingCycle): number {
  return cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
}

export function formatKrw(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
