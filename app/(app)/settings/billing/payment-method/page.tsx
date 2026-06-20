import Link from "next/link";

import { BillingSubNav } from "@/components/billing/billing-sub-nav";
import { PaymentMethodForm } from "@/components/billing/payment-method-form";
import { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/subscription";

export const metadata = {
  title: "결제수단 관리",
};

export default async function PaymentMethodPage() {
  const supabase = await createClient();
  const subscription = await getSubscription(supabase);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">결제수단 변경</h1>
        <p className="text-sm text-muted-foreground">
          나이스페이 인증창에서 새 카드를 등록합니다.
        </p>
      </div>

      <BillingSubNav />

      <PaymentMethodForm
        planId={subscription.planId === "free" ? "pro" : subscription.planId}
        cycle={subscription.billingCycle}
      />

      <p className="text-center text-sm">
        <Link
          href="/settings/billing"
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          결제 및 구독으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
