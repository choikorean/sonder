import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CheckoutForm } from "@/components/billing/checkout-form";
import { createClient } from "@/lib/supabase/server";
import { resolveCanManageBilling } from "@/lib/billing/access";
import {
  getPlan,
  isBillingCycle,
  isPlanId,
  planPrice,
  type BillingCycle,
  type PlanId,
} from "@/lib/plans";

export const metadata = {
  title: "구독 시작",
};

type Props = {
  searchParams: Promise<{ plan?: string; cycle?: string }>;
};

export default async function BillingCheckoutPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await resolveCanManageBilling(supabase, user.id))) {
    redirect("/billing");
  }

  const params = await searchParams;
  const planRaw = params.plan ?? "pro";
  const cycleRaw = params.cycle ?? "monthly";

  if (!isPlanId(planRaw) || planRaw === "free") {
    notFound();
  }

  if (!isBillingCycle(cycleRaw)) {
    notFound();
  }

  const planId = planRaw as Exclude<PlanId, "free">;
  const cycle = cycleRaw as BillingCycle;
  const plan = getPlan(planId);
  const amount = planPrice(plan, cycle);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">구독 시작</h1>
        <p className="text-sm text-muted-foreground">
          카드를 등록하고 {plan.name} 플랜 무료 체험을 시작하세요.
        </p>
      </div>

      <CheckoutForm planId={planId} cycle={cycle} amount={amount} />

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/settings/billing" className="underline-offset-4 hover:underline">
          결제 및 구독 관리
        </Link>
      </p>
    </div>
  );
}
