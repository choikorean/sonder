import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatKrw,
  getPlan,
  isPlanId,
  type PlanId,
} from "@/lib/plans";
import { formatBillingDate } from "@/lib/billing/helpers";

export const metadata = {
  title: "카드 등록 결과",
};

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function BillingCompletePage({ searchParams }: Props) {
  const params = await searchParams;
  const success = params.status === "success";
  const message = params.message;
  const checkoutType = params.checkoutType ?? "subscription";
  const planId = params.planId;
  const trialEndsAt = params.trialEndsAt;
  const nextBillingAt = params.nextBillingAt;
  const amount = params.amount ? Number(params.amount) : null;

  const plan =
    planId && isPlanId(planId) ? getPlan(planId as PlanId) : null;

  if (!success) {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <h1 className="text-2xl font-bold">카드 등록에 실패했습니다.</h1>
        <p className="text-sm text-muted-foreground">
          {message ?? "카드사 인증 실패 또는 사용 불가 카드입니다."}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/billing/checkout"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            다시 등록하기
          </Link>
          <Link
            href="/settings/billing/payment-method"
            className={cn(buttonVariants())}
          >
            다른 카드 사용하기
          </Link>
        </div>
      </div>
    );
  }

  if (checkoutType === "change_card") {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <h1 className="text-2xl font-bold">결제수단이 변경되었습니다.</h1>
        <p className="text-sm text-muted-foreground">
          새 카드로 다음 결제부터 자동 청구됩니다.
        </p>
        <Link href="/settings/billing" className={cn(buttonVariants(), "inline-flex")}>
          결제 및 구독으로 이동
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">카드 등록이 완료되었습니다.</h1>
        <p className="text-sm text-muted-foreground">
          무료 체험이 시작되었습니다. 체험 종료 후 자동 결제됩니다.
        </p>
      </div>

      <section className="rounded-xl border border-border p-6 text-sm">
        <dl className="space-y-3">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">요금제</dt>
            <dd className="font-medium">{plan?.name ?? "-"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">무료 체험 종료일</dt>
            <dd className="font-medium">{formatBillingDate(trialEndsAt)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">다음 결제 예정일</dt>
            <dd className="font-medium">{formatBillingDate(nextBillingAt)}</dd>
          </div>
          {amount !== null && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">결제금액</dt>
              <dd className="font-medium">{formatKrw(amount)}</dd>
            </div>
          )}
        </dl>
      </section>

      <Link href="/dashboard" className={cn(buttonVariants(), "inline-flex w-full justify-center")}>
        대시보드로 이동
      </Link>
    </div>
  );
}
