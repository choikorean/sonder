import "server-only";

import { addDays } from "@/lib/billing/helpers";
import { recordBillingEvent } from "@/lib/billing/subscription-service";
import type { OrganizationContext } from "@/lib/org";
import { createServiceClient } from "@/lib/supabase/service";
import {
  ACCOUNT_DATA_RETENTION_DAYS,
  canWithdrawAccount,
  mustCancelBeforeWithdraw,
} from "@/lib/account/withdraw";
import type { CurrentSubscription } from "@/lib/subscription";

export class AccountWithdrawError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function withdrawUserAccount(params: {
  userId: string;
  subscription: CurrentSubscription;
  canManageBilling: boolean;
  organization: OrganizationContext | null;
}): Promise<{ hardDeleteAt: string }> {
  const { userId, subscription, canManageBilling, organization } = params;
  const supabase = createServiceClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("withdrawn_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new AccountWithdrawError("회원 정보를 확인하지 못했습니다.", 500);
  }

  if (profile?.withdrawn_at) {
    throw new AccountWithdrawError("이미 탈퇴 처리된 계정입니다.", 400);
  }

  if (organization?.role === "owner" && organization.activeMemberCount > 1) {
    throw new AccountWithdrawError(
      "팀 소유자는 다른 팀원이 있을 때 탈퇴할 수 없습니다. 팀원을 제거한 뒤 다시 시도해 주세요.",
      400,
    );
  }

  if (mustCancelBeforeWithdraw(subscription, canManageBilling)) {
    throw new AccountWithdrawError(
      "이용 중인 유료 구독이 있습니다. 구독 해지를 먼저 진행한 뒤 회원 탈퇴를 해 주세요.",
      400,
    );
  }

  if (!canWithdrawAccount(subscription, canManageBilling)) {
    throw new AccountWithdrawError("현재 회원 탈퇴를 진행할 수 없습니다.", 400);
  }

  const now = new Date();
  const hardDeleteAt = addDays(now, ACCOUNT_DATA_RETENTION_DAYS);

  if (organization) {
    await supabase
      .from("organization_members")
      .update({ status: "removed" })
      .eq("user_id", userId)
      .eq("status", "active");

    if (organization.role === "owner" && organization.activeMemberCount === 1) {
      await supabase.from("organizations").delete().eq("id", organization.id);
    }
  }

  if (subscription.isTrialing) {
    if (organization?.role === "owner") {
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: false,
          canceled_at: now.toISOString(),
          next_billing_at: null,
        })
        .eq("organization_id", organization.id);
    } else {
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: false,
          canceled_at: now.toISOString(),
          next_billing_at: null,
        })
        .eq("user_id", userId);
    }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      withdrawn_at: now.toISOString(),
      hard_delete_at: hardDeleteAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    throw new AccountWithdrawError("회원 탈퇴 처리에 실패했습니다.", 500);
  }

  await recordBillingEvent(supabase, userId, "account_withdrawn", {
    hardDeleteAt: hardDeleteAt.toISOString(),
    wasTrialing: subscription.isTrialing,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  });

  return { hardDeleteAt: hardDeleteAt.toISOString() };
}
