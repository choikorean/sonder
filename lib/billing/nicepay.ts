import "server-only";

import type { BillingProvider } from "./types";

/**
 * NicePay 빌링은 prepare + auth-callback 플로우를 사용합니다.
 * createCheckout는 manual과 동일하게 pending을 반환하고,
 * 실제 결제는 /api/billing/prepare → 인증창 경로를 사용하세요.
 */
export const nicepayProvider: BillingProvider = {
  id: "nicepay",
  async createCheckout() {
    return {
      kind: "pending",
      message: "카드 등록 화면에서 결제를 진행해 주세요.",
    };
  },
};
