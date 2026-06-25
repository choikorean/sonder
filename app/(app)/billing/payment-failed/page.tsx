import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { RetryPaymentButton } from "@/components/billing/retry-payment-button";
import { createClient } from "@/lib/supabase/server";
import { resolveCanManageBilling } from "@/lib/billing/access";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "결제 실패",
};

export default async function PaymentFailedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await resolveCanManageBilling(supabase, user.id))) {
    redirect("/billing");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <h1 className="text-2xl font-bold">이번 달 구독 결제가 완료되지 않았습니다.</h1>
      <p className="text-sm text-muted-foreground">
        서비스 이용을 계속하려면 결제수단을 확인해 주세요.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/settings/billing/payment-method"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          결제수단 변경
        </Link>
        <RetryPaymentButton />
      </div>
    </div>
  );
}
