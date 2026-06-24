import { createClient } from "@/lib/supabase/server";
import {
  ClientGenerationError,
  getClientById,
  resolveClientForGeneration,
} from "@/lib/clients";
import { getHistory } from "@/lib/history";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { HistoryView } from "@/components/history-view";

export const metadata = {
  title: "생성 내역",
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);

  let filterClientId: string | undefined;
  let filterClientName: string | null = null;

  if (params.clientId && ctx.capabilities.clientProfiles) {
    try {
      const resolved = await resolveClientForGeneration(supabase, {
        capabilities: ctx.capabilities,
        subscription: ctx.subscription,
        organizationId: ctx.organization?.id,
        clientId: params.clientId,
      });
      filterClientId = resolved.clientId ?? undefined;
      if (filterClientId) {
        const client = await getClientById(supabase, filterClientId);
        filterClientName = client?.name ?? null;
      }
    } catch (err) {
      if (!(err instanceof ClientGenerationError)) {
        throw err;
      }
    }
  }

  const data = await getHistory(supabase, {
    retentionDays: ctx.retentionDays,
    clientId: filterClientId,
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
        {filterClientName && (
          <p className="text-sm text-muted-foreground">
            「{filterClientName}」 고객의 생성 내역만 표시 중입니다.
          </p>
        )}
      </div>
      <HistoryView
        data={data}
        retentionDays={ctx.retentionDays}
        reviewSummary={ctx.capabilities.reviewSummary}
        fullConsultationOutput={ctx.capabilities.fullConsultationOutput}
        canFilterByClient={ctx.capabilities.clientProfiles}
        selectedClientId={filterClientId ?? null}
      />
    </div>
  );
}
