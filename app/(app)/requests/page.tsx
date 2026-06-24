import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { RequestForm } from "@/components/forms/request-form";

export const metadata = {
  title: "자료 요청 생성",
};

export default async function RequestsPage({
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
        <h1 className="text-2xl font-bold tracking-tight">자료 요청 생성</h1>
        <p className="text-sm text-muted-foreground">
          세목과 사업 유형을 선택하면 거래처에 보낼 자료 요청문을 생성합니다.
        </p>
      </div>
      <RequestForm
        canSelectClient={ctx.capabilities.clientProfiles}
        initialClientId={params.clientId ?? null}
      />
    </div>
  );
}
