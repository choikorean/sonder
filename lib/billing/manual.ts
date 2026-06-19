import type { BillingProvider } from "./types";

/**
 * 국내 PG 미선정 상태의 기본 제공자.
 * 주문(payment_orders)은 정상 생성하되, 실제 결제·구독 활성화는
 * PG 연동(웹훅 + 서비스 롤) 완료 시점으로 보류합니다.
 */
export const manualProvider: BillingProvider = {
  id: "manual",
  async createCheckout() {
    return {
      kind: "pending",
      message:
        "결제 주문이 접수되었습니다. 국내 PG(토스페이먼츠/포트원 등) 연동이 완료되면 결제가 진행됩니다.",
    };
  },
};
