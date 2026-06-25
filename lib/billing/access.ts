import "server-only";

import type { User } from "@supabase/supabase-js";

import { errorResponse } from "@/lib/api-response";
import { getAuthContext } from "@/lib/auth";
import { getOrganizationContext, type OrganizationContext } from "@/lib/org";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export const BILLING_FORBIDDEN_MESSAGE =
  "결제 및 구독은 사무소 소유자만 변경할 수 있습니다.";

/** Team 조직 소속이 아니거나, 조직 소유자인 경우에만 결제·구독을 변경할 수 있습니다. */
export function canManageBilling(
  organization: OrganizationContext | null,
): boolean {
  if (!organization) {
    return true;
  }
  return organization.role === "owner";
}

export async function resolveCanManageBilling(
  supabase: SupabaseServer,
  userId: string,
): Promise<boolean> {
  const organization = await getOrganizationContext(supabase, userId);
  return canManageBilling(organization);
}

export async function requireBillingManager(): Promise<
  | {
      ok: true;
      supabase: SupabaseServer;
      user: User;
    }
  | {
      ok: false;
      response: ReturnType<typeof errorResponse>;
    }
> {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return { ok: false, response: errorResponse("로그인이 필요합니다.", 401) };
  }

  const allowed = await resolveCanManageBilling(supabase, user.id);
  if (!allowed) {
    return {
      ok: false,
      response: errorResponse(BILLING_FORBIDDEN_MESSAGE, 403),
    };
  }

  return { ok: true, supabase, user };
}
