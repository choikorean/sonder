import Link from "next/link";
import { redirect } from "next/navigation";

import { BillingSubNav } from "@/components/billing/billing-sub-nav";
import { CancelSubscriptionForm } from "@/components/billing/cancel-subscription-form";
import { createClient } from "@/lib/supabase/server";
import { canAccessCancelSubscriptionPage } from "@/lib/account/withdraw";
import { getSubscription } from "@/lib/subscription";

export const metadata = {
  title: "구독 해지",
};

export default async function CancelBillingPage() {
  const supabase = await createClient();
  const subscription = await getSubscription(supabase);

  if (!canAccessCancelSubscriptionPage(subscription)) {
    redirect("/settings/billing");
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">구독 해지</h1>
        <p className="text-sm text-muted-foreground">
          해지 후에도 현재 결제기간 종료일까지 이용할 수 있습니다.
        </p>
      </div>

      <BillingSubNav />

      <CancelSubscriptionForm />

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
