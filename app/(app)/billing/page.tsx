import { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/subscription";
import { getUsageStatus } from "@/lib/usage";
import { PlanSelector } from "@/components/billing/plan-selector";

export const metadata = {
  title: "요금제",
};

const STATUS_LABELS: Record<string, string> = {
  active: "이용 중",
  trialing: "무료 체험 중",
  past_due: "결제 실패",
  canceled: "해지 예정",
  inactive: "미구독",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BillingPage() {
  const supabase = await createClient();
  const [subscription, usage] = await Promise.all([
    getSubscription(supabase),
    getUsageStatus(supabase),
  ]);

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

      <section className="rounded-xl border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">현재 플랜</p>
            <p className="mt-1 text-xl font-semibold">
              {subscription.plan.name}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {STATUS_LABELS[subscription.status] ?? subscription.status}
              </span>
            </p>
          </div>
          {subscription.isActive && subscription.currentPeriodEnd && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {subscription.isTrialing ? "체험 종료일" : "다음 갱신일"}
              </p>
              <p className="mt-1 text-sm font-medium">
                {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">이번 달 생성</span>
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

      <PlanSelector
        currentPlanId={subscription.effectivePlanId}
        isActive={subscription.isActive}
        canStartTrial={!subscription.isActive}
      />
    </div>
  );
}
