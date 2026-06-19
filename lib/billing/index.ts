import "server-only";

import type { BillingProvider } from "./types";
import { manualProvider } from "./manual";

/**
 * 환경 변수 BILLING_PROVIDER 값에 따라 결제 제공자를 선택합니다.
 * 국내 PG 연동 시 case를 추가하세요. (예: "toss", "portone")
 */
export function getBillingProvider(): BillingProvider {
  switch (process.env.BILLING_PROVIDER) {
    // case "toss":
    //   return tossProvider;
    // case "portone":
    //   return portoneProvider;
    default:
      return manualProvider;
  }
}

export type {
  BillingProvider,
  CheckoutRequest,
  CheckoutResult,
  PaidPlanId,
} from "./types";
