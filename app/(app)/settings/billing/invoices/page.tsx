import Link from "next/link";

import { BillingSubNav } from "@/components/billing/billing-sub-nav";
import { createClient } from "@/lib/supabase/server";
import { getPaymentHistory } from "@/lib/billing/queries";
import {
  formatBillingDate,
  formatPaymentDate,
  PAYMENT_STATUS_LABELS,
} from "@/lib/billing/helpers";
import { formatKrw } from "@/lib/plans";

export const metadata = {
  title: "결제내역",
};

export default async function BillingInvoicesPage() {
  const supabase = await createClient();
  const payments = await getPaymentHistory(supabase);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">결제내역</h1>
        <p className="text-sm text-muted-foreground">
          최근 50건의 결제 기록입니다.
        </p>
      </div>

      <BillingSubNav />

      {payments.length === 0 ? (
        <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          아직 결제 내역이 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">결제일</th>
                <th className="px-4 py-3 font-medium">상품</th>
                <th className="px-4 py-3 font-medium">금액</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">승인번호</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    {formatPaymentDate(payment.paid_at ?? payment.created_at)}
                  </td>
                  <td className="px-4 py-3">{payment.goods_name}</td>
                  <td className="px-4 py-3">{formatKrw(payment.amount)}</td>
                  <td className="px-4 py-3">
                    {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                  </td>
                  <td className="px-4 py-3">{payment.auth_code ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-sm">
        <Link
          href="/settings/billing"
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          결제 및 구독으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
