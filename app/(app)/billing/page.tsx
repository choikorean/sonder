import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { getUsageStatus } from "@/lib/usage";
import { PlanSelector } from "@/components/billing/plan-selector";
import { SettingsNav } from "@/components/settings/settings-nav";
import {
  BILLING_STATUS_LABELS,
  formatBillingDate,
} from "@/lib/billing/helpers";

export const metadata = {
  title: "요금제",
};

export default async function BillingPage() {
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);
  const { subscription } = ctx;
  const usage = await getUsageStatus(supabase);

  const percent =
    usage.limit > 0
      ? Math.min(100, Math.round((usage.used / usage.limit) * 100))
      : 0;

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">요금제</h1>
        <p className="text-sm text-muted-foreground">
          신고 시즌 반복 업무 시간을 줄이는 플랜을 선택하세요.
        </p>
      </div>

      <SettingsNav
        activeHref="/billing"
        canManageBilling={ctx.canManageBilling}
      />

      <section className="rounded-xl border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">현재 플랜</p>
            <p className="mt-1 text-xl font-semibold">
              {subscription.plan.name}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {BILLING_STATUS_LABELS[
                  subscription.cancelAtPeriodEnd ? "canceled" : subscription.status
                ] ?? subscription.status}
              </span>
            </p>
          </div>
          {(subscription.isActive || usage.trialExpired) && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {subscription.isTrialing || usage.trialExpired
                  ? "체험 종료일"
                  : "다음 갱신일"}
              </p>
              <p className="mt-1 text-sm font-medium">
                {formatBillingDate(
                  subscription.isTrialing || usage.trialExpired
                    ? subscription.trialEndsAt ?? subscription.currentPeriodEnd
                    : subscription.nextBillingAt ?? subscription.currentPeriodEnd,
                )}
              </p>
            </div>
          )}
        </div>

        {ctx.canManageBilling && (
          <div className="mt-4">
            <a
              href="/settings/billing"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              결제 및 구독 관리 →
            </a>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {usage.trialExpired && (
            <p className="text-sm text-muted-foreground">
              무료 체험 기간이 종료되었습니다. 생성 내역은 조회할 수 있습니다.
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{usage.usagePeriodLabel}</span>
            <span className="font-medium">
              {usage.used.toLocaleString()} / {usage.limit.toLocaleString()}건
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={
                usage.allowed
                  ? "h-full rounded-full bg-foreground"
                  : "h-full rounded-full bg-destructive"
              }
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </section>

      {ctx.canManageBilling ? (
        <PlanSelector
          currentPlanId={subscription.effectivePlanId}
          isActive={subscription.isActive}
          canStartTrial={!subscription.isActive}
        />
      ) : (
        <section className="rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          요금제 변경과 결제 관리는 사무소 소유자만 할 수 있습니다. 현재 플랜과
          사용량은 위에서 확인할 수 있습니다.
        </section>
      )}
    </div>
  );
}
