import type { PlanId, BillingCycle } from "@/lib/plans";

export type PaidPlanId = Exclude<PlanId, "free">;

export type CheckoutRequest = {
  orderId: string;
  userId: string;
  planId: PaidPlanId;
  cycle: BillingCycle;
  /** 결제 금액(원, 부가세 별도) */
  amount: number;
  appUrl: string;
};

export type CheckoutResult =
  | { kind: "redirect"; url: string; providerOrderId: string }
  | { kind: "pending"; message: string };

/**
 * 결제 대행사(PG) 추상화.
 * 국내 PG(토스페이먼츠/포트원 등) 선정 후 이 인터페이스를 구현해 등록하면
 * 나머지 결제 흐름은 그대로 동작합니다.
 */
export interface BillingProvider {
  readonly id: string;
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
}
