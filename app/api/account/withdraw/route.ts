import { type NextRequest } from "next/server";

import {
  AccountWithdrawError,
  withdrawUserAccount,
} from "@/lib/account/withdraw-service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getAuthContext } from "@/lib/auth";
import { getSubscriberContext } from "@/lib/subscriber-context";

export async function POST(_request: NextRequest) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const ctx = await getSubscriberContext(supabase);

  try {
    const result = await withdrawUserAccount({
      userId: user.id,
      subscription: ctx.subscription,
      canManageBilling: ctx.canManageBilling,
      organization: ctx.organization,
    });

    await supabase.auth.signOut();

    return successResponse({
      hardDeleteAt: result.hardDeleteAt,
      message: "회원 탈퇴가 완료되었습니다.",
    });
  } catch (error) {
    if (error instanceof AccountWithdrawError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("회원 탈퇴 처리에 실패했습니다.", 500);
  }
}
