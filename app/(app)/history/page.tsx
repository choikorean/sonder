import { createClient } from "@/lib/supabase/server";
import { getHistory } from "@/lib/history";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { HistoryView } from "@/components/history-view";

export const metadata = {
  title: "생성 내역",
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);
  const data = await getHistory(supabase, {
    retentionDays: ctx.retentionDays,
  });

  const isTeamShared =
    Boolean(ctx.organization) &&
    ctx.subscription.effectivePlanId === "team" &&
    ctx.subscription.isActive;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">생성 내역</h1>
        <p className="text-sm text-muted-foreground">
          {isTeamShared
            ? "사무소 구성원이 생성한 결과를 확인하고 복사할 수 있습니다."
            : "이전에 생성한 결과를 확인하고 복사할 수 있습니다."}
        </p>
      </div>
      <HistoryView
        data={data}
        retentionDays={ctx.retentionDays}
        reviewSummary={ctx.capabilities.reviewSummary}
        copyFormats={ctx.capabilities.copyFormats}
        fullConsultationOutput={ctx.capabilities.fullConsultationOutput}
      />
    </div>
  );
}
