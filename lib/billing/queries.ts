import type { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/subscription";
import { BILLING_STATUS_LABELS } from "@/lib/billing/helpers";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export type BillingOverview = Awaited<ReturnType<typeof getBillingOverview>>;

export async function getBillingOverview(supabase: SupabaseServer) {
  const subscription = await getSubscription(supabase);

  const { data: billingKey } = await supabase
    .from("billing_keys")
    .select("card_name, card_no_masked, issued_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: lastPayment } = await supabase
    .from("payments")
    .select("status, paid_at, amount, auth_code")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const displayStatus = subscription.cancelAtPeriodEnd
    ? "canceled"
    : subscription.status;

  return {
    subscription,
    billingKey,
    lastPayment,
    statusLabel:
      BILLING_STATUS_LABELS[displayStatus] ?? subscription.status,
  };
}

export async function getPaymentHistory(supabase: SupabaseServer) {
  const { data } = await supabase
    .from("payments")
    .select(
      "id, amount, goods_name, status, auth_code, auth_date, paid_at, created_at, result_msg",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}
