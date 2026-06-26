import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { BillingSubNav } from "@/components/billing/billing-sub-nav";
import { createClient } from "@/lib/supabase/server";
import { getBillingOverview } from "@/lib/billing/queries";
import { canAccessCancelSubscriptionPage } from "@/lib/account/withdraw";
import { formatBillingDate } from "@/lib/billing/helpers";
import { formatKrw, planPrice } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "결제 및 구독",
};

export default async function SettingsBillingPage() {
  const supabase = await createClient();
  const overview = await getBillingOverview(supabase);
  const { subscription, billingKey, statusLabel } = overview;
  const monthlyAmount = planPrice(subscription.plan, subscription.billingCycle);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">결제 및 구독</h1>
        <p className="text-sm text-muted-foreground">
          현재 요금제, 결제수단, 결제내역을 관리합니다.
        </p>
      </div>

      <BillingSubNav />

      <section className="rounded-xl border border-border p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">현재 요금제</dt>
            <dd className="mt-1 font-semibold">{subscription.plan.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">상태</dt>
            <dd className="mt-1 font-medium">{statusLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">월 결제금액</dt>
            <dd className="mt-1 font-medium">{formatKrw(monthlyAmount)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">다음 결제일</dt>
            <dd className="mt-1 font-medium">
              {formatBillingDate(
                subscription.nextBillingAt ?? subscription.currentPeriodEnd,
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">등록 카드</dt>
            <dd className="mt-1 font-medium">
              {billingKey?.card_name && billingKey?.card_no_masked
                ? `${billingKey.card_name} ${billingKey.card_no_masked}`
                : "등록된 카드 없음"}
            </dd>
          </div>
        </dl>

        {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
          <div className="mt-6 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            구독 해지가 예약되었습니다.{" "}
            {formatBillingDate(subscription.currentPeriodEnd)}까지 이용할 수
            있습니다.
          </div>
        )}

        {subscription.status === "past_due" && (
          <div className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            결제에 실패했습니다. 결제수단을 확인하거나 다시 결제해 주세요.
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/settings/billing/payment-method"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          결제수단 변경
        </Link>
        <Link href="/billing" className={cn(buttonVariants({ variant: "outline" }))}>
          요금제 변경
        </Link>
        <Link
          href="/settings/billing/invoices"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          결제내역 보기
        </Link>
        {canAccessCancelSubscriptionPage(subscription) && (
          <Link
            href="/settings/billing/cancel"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            구독 해지
          </Link>
        )}
      </div>
    </div>
  );
}
