import "server-only";

import { recordBillingEvent } from "@/lib/billing/subscription-service";
import {
  canReactivateWithdrawnAccount,
  getWithdrawnAccountStatus,
  normalizeAccountEmail,
  type WithdrawnAccountStatus,
} from "@/lib/account/reactivate";
import { resolveTrialRestoreAction } from "@/lib/trial";
import { createServiceClient } from "@/lib/supabase/service";

export class AccountReactivateError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type WithdrawnProfileRow = {
  id: string;
  email: string;
  withdrawn_at: string | null;
  hard_delete_at: string | null;
};

async function findProfileByEmail(
  email: string,
): Promise<WithdrawnProfileRow | null> {
  const supabase = createServiceClient();
  const normalizedEmail = normalizeAccountEmail(email);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, withdrawn_at, hard_delete_at")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new AccountReactivateError("계정 정보를 확인하지 못했습니다.", 500);
  }

  return data;
}

export async function getWithdrawnStatusByEmail(
  email: string,
): Promise<WithdrawnAccountStatus> {
  const profile = await findProfileByEmail(email);
  return getWithdrawnAccountStatus(profile);
}

async function restoreFreeTrialIfNeeded(userId: string) {
  const supabase = createServiceClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, trial_ends_at, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const action = resolveTrialRestoreAction(subscription);
  if (action.kind === "noop") {
    return;
  }

  const now = new Date().toISOString();
  const patch =
    action.kind === "restore_trialing"
      ? {
          status: "trialing" as const,
          plan: "free" as const,
          cancel_at_period_end: false,
          canceled_at: null,
          updated_at: now,
        }
      : {
          status: "inactive" as const,
          plan: "free" as const,
          cancel_at_period_end: false,
          canceled_at: null,
          updated_at: now,
        };

  const { error } = await supabase
    .from("subscriptions")
    .update(patch)
    .eq("user_id", userId);

  if (error) {
    throw new AccountReactivateError("무료 체험 상태 복구에 실패했습니다.", 500);
  }
}

export async function reactivateWithdrawnAccount(params: {
  email: string;
  password: string;
  name: string;
}): Promise<{ userId: string }> {
  const normalizedEmail = normalizeAccountEmail(params.email);
  const trimmedName = params.name.trim();

  if (!trimmedName) {
    throw new AccountReactivateError("이름을 입력해 주세요.", 400);
  }

  const profile = await findProfileByEmail(normalizedEmail);
  if (!profile) {
    throw new AccountReactivateError(
      "복구 가능한 탈퇴 계정을 찾을 수 없습니다.",
      404,
    );
  }

  const status = getWithdrawnAccountStatus(profile);
  if (status.kind === "retention_expired") {
    throw new AccountReactivateError(
      "데이터 보관 기간이 만료되어 동일 이메일로 계정을 복구할 수 없습니다.",
      400,
    );
  }

  if (status.kind !== "can_reactivate") {
    throw new AccountReactivateError(
      "복구 가능한 탈퇴 계정이 아닙니다.",
      400,
    );
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { error: authError } = await supabase.auth.admin.updateUserById(
    profile.id,
    {
      password: params.password,
      email_confirm: true,
      user_metadata: { name: trimmedName },
    },
  );

  if (authError) {
    throw new AccountReactivateError(
      "비밀번호를 업데이트하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      500,
    );
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      name: trimmedName,
      withdrawn_at: null,
      hard_delete_at: null,
      updated_at: now,
    })
    .eq("id", profile.id);

  if (profileError) {
    throw new AccountReactivateError("계정 복구에 실패했습니다.", 500);
  }

  await restoreFreeTrialIfNeeded(profile.id);

  await recordBillingEvent(supabase, profile.id, "account_reactivated", {
    email: normalizedEmail,
  });

  return { userId: profile.id };
}
