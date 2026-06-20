"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PLANS,
  PURCHASABLE_PLAN_IDS,
  formatKrw,
  planPrice,
  type BillingCycle,
  type PlanId,
} from "@/lib/plans";

type Props = {
  currentPlanId: PlanId;
  isActive: boolean;
  canStartTrial: boolean;
};

export function PlanSelector({ currentPlanId, isActive, canStartTrial }: Props) {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(planId: PlanId) {
    setLoadingPlan(planId);
    setNotice(null);
    setError(null);
    try {
      router.push(
        `/billing/checkout?plan=${planId}&cycle=${cycle}`,
      );
    } catch {
      setError("결제 화면으로 이동하지 못했습니다.");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function startTrial() {
    setTrialLoading(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch("/api/billing/trial", { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "무료 체험을 시작하지 못했습니다.");
        return;
      }
      setNotice("14일 무료 체험이 시작되었습니다.");
      router.refresh();
    } catch {
      setError("무료 체험 요청 중 오류가 발생했습니다.");
    } finally {
      setTrialLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {canStartTrial && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-foreground" />
            <div>
              <p className="text-sm font-semibold">14일 무료 체험</p>
              <p className="text-sm text-muted-foreground">
                신용카드 없이 바로 시작하세요. 생성 30건 · 상담 요약 5건을
                체험할 수 있습니다.
              </p>
            </div>
          </div>
          <Button
            onClick={startTrial}
            disabled={trialLoading}
            className="shrink-0"
          >
            {trialLoading ? "시작 중..." : "무료로 시작하기"}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <CycleButton
          active={cycle === "monthly"}
          onClick={() => setCycle("monthly")}
        >
          월 결제
        </CycleButton>
        <CycleButton
          active={cycle === "yearly"}
          onClick={() => setCycle("yearly")}
        >
          연 결제 · 2개월 무료
        </CycleButton>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-md bg-muted px-4 py-3 text-sm text-foreground">
          {notice}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {PURCHASABLE_PLAN_IDS.map((planId) => {
          const plan = PLANS[planId];
          const price = planPrice(plan, cycle);
          const isCurrent = isActive && currentPlanId === planId;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-xl border bg-background p-6",
                plan.highlight
                  ? "border-foreground shadow-sm ring-1 ring-foreground/10"
                  : "border-border",
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-6 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
                  {plan.badge}
                </span>
              )}
              <div className="space-y-1">
                <p className="text-base font-semibold">{plan.name}</p>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{formatKrw(price)}</span>
                <span className="text-sm text-muted-foreground">
                  / {cycle === "yearly" ? "년" : "월"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">부가세 별도</p>

              <ul className="mt-5 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => checkout(plan.id)}
                disabled={loadingPlan !== null || isCurrent}
                variant={plan.highlight ? "default" : "outline"}
                className="mt-6 w-full"
              >
                {isCurrent
                  ? "이용 중인 플랜"
                    : loadingPlan === plan.id
                    ? "이동 중..."
                    : "구독 시작하기"}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        결제 진행 시 부가세(10%)가 별도로 부과됩니다. 연 결제는 2개월 무료가
        적용된 금액입니다.
      </p>
    </div>
  );
}

function CycleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm transition-colors",
        active
          ? "bg-foreground text-background"
          : "border border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
