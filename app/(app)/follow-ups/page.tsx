import { createClient } from "@/lib/supabase/server";
import { listFollowUpTasks } from "@/lib/follow-up/service";
import { canAccessTeamFeatures } from "@/lib/org";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { FollowUpsPageClient } from "@/components/follow-ups/follow-ups-page-client";

export const metadata = {
  title: "후속 조치",
};

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status =
    params.status === "done" || params.status === "all"
      ? params.status
      : "pending";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ctx = await getSubscriberContext(supabase);

  const tasks = user
    ? await listFollowUpTasks(supabase, {
        ctx,
        userId: user.id,
        status,
      })
    : [];

  const canAssign = canAccessTeamFeatures(
    ctx.organization,
    ctx.featurePlanId,
    ctx.subscription.isActive,
  );

  const orgMembers =
    canAssign && ctx.organization
      ? ctx.organization.members.map((member) => ({
          userId: member.userId,
          name: member.name ?? "이름 없음",
        }))
      : [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">후속 조치</h1>
        <p className="text-sm text-muted-foreground">
          상담 요약에서 생성된 내부 후속 조치를 확인하고 완료 처리합니다.
        </p>
      </div>

      <FollowUpsPageClient
        initialTasks={tasks}
        initialStatus={status}
        canAssign={canAssign}
        orgMembers={orgMembers}
      />
    </div>
  );
}
