import "server-only";

import type { BillingProvider } from "./types";
import { manualProvider } from "./manual";
import { nicepayProvider } from "./nicepay";

/**
 * 환경 변수 BILLING_PROVIDER 값에 따라 결제 제공자를 선택합니다.
 */
export function getBillingProvider(): BillingProvider {
  switch (process.env.BILLING_PROVIDER) {
    case "nicepay":
      return nicepayProvider;
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
