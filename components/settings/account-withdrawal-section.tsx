import Link from "next/link";

import {
  getAccountWithdrawalUiState,
  ACCOUNT_DATA_RETENTION_DAYS,
} from "@/lib/account/withdraw";
import type { SubscriberContext } from "@/lib/subscriber-context";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccountWithdrawalSection({
  ctx,
}: {
  ctx: SubscriberContext;
}) {
  const uiState = getAccountWithdrawalUiState({
    subscription: ctx.subscription,
    canManageBilling: ctx.canManageBilling,
    isTeamOwner: ctx.organization?.role === "owner",
    activeTeamMemberCount: ctx.organization?.activeMemberCount ?? 0,
  });

  if (uiState.kind === "team_owner_blocked") {
    return (
      <section className="rounded-xl border border-border p-6 text-sm">
        <h2 className="text-base font-semibold">회원 탈퇴</h2>
        <p className="mt-2 text-muted-foreground">
          팀 소유자는 다른 팀원({uiState.memberCount - 1}명)이 남아 있을 때
          탈퇴할 수 없습니다. 팀원을 제거한 뒤 다시 시도해 주세요.
        </p>
        <Link
          href="/settings/team"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 inline-flex")}
        >
          팀 관리로 이동
        </Link>
      </section>
    );
  }

  if (uiState.kind === "cancel_required") {
    return (
      <section className="rounded-xl border border-border p-6 text-sm">
        <h2 className="text-base font-semibold">회원 탈퇴</h2>
        <p className="mt-2 text-muted-foreground">
          이용 중인 유료 구독이 있습니다. 회원 탈퇴 전에 구독 해지를 먼저
          진행해 주세요. 해지 후에는 현재 결제기간 종료일까지 서비스를 이용할
          수 있습니다.
        </p>
        {ctx.canManageBilling && (
          <Link
            href="/settings/billing/cancel"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 inline-flex")}
          >
            구독 해지하기
          </Link>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-2">
      {ctx.subscription.cancelAtPeriodEnd && (
        <p className="text-sm text-muted-foreground">
          구독 해지가 예약된 상태입니다. 회원 탈퇴 시 즉시 로그인이 제한되며,
          데이터는 탈퇴일로부터 {ACCOUNT_DATA_RETENTION_DAYS}일간 보관됩니다.
        </p>
      )}
      <DeleteAccountForm />
    </section>
  );
}
