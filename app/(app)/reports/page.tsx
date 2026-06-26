import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { ReportForm } from "@/components/forms/report-form";

export const metadata = {
  title: "신고 결과 설명문",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">신고 결과 설명문</h1>
        <p className="text-sm text-muted-foreground">
          신고 세액 정보를 입력하면 고객이 이해하기 쉬운 설명문을 생성합니다. 세목
          선택 시 국세청 일정 기준 납부기한을 제안하고, 금액·변동·납부 안내를
          섹션별로 복사할 수 있습니다.
        </p>
      </div>
      <ReportForm
        canSelectClient={ctx.capabilities.clientProfiles}
        initialClientId={params.clientId ?? null}
      />
    </div>
  );
}
