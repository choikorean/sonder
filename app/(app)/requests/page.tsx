import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { RequestForm } from "@/components/forms/request-form";

export const metadata = {
  title: "자료 요청 생성",
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; memo?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">자료 요청 생성</h1>
        <p className="text-sm text-muted-foreground">
          세목과 사업 유형을 선택하면 거래처에 보낼 자료 요청문을 생성합니다.
        </p>
        {ctx.capabilities.clientProfiles && (
          <p className="text-sm text-muted-foreground">
            여러 거래처를 한꺼번에 관리하려면{" "}
            <Link href="/campaigns" className="font-medium text-foreground underline underline-offset-4">
              자료 요청 캠페인
            </Link>
            을, 고객 질문에 답할 설명문은{" "}
            <Link href="/requests/explain" className="font-medium text-foreground underline underline-offset-4">
              자료 필요 이유 설명
            </Link>
            을 이용해 보세요.
          </p>
        )}
      </div>
      <RequestForm
        canSelectClient={ctx.capabilities.clientProfiles}
        initialClientId={params.clientId ?? null}
        initialMemo={params.memo ?? ""}
      />
    </div>
  );
}
