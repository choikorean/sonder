import { createClient } from "@/lib/supabase/server";
import { canAccessTeamFeatures } from "@/lib/org";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { ConsultationForm } from "@/components/forms/consultation-form";

export const metadata = {
  title: "상담 요약",
};

export default async function ConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);
  const fullOutput = ctx.capabilities.fullConsultationOutput;
  const canAssignFollowUps = canAccessTeamFeatures(
    ctx.organization,
    ctx.featurePlanId,
    ctx.subscription.isActive,
  );
  const orgMembers =
    canAssignFollowUps && ctx.organization
      ? ctx.organization.members.map((member) => ({
          userId: member.userId,
          name: member.name ?? "이름 없음",
        }))
      : [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">상담 요약</h1>
        <p className="text-sm text-muted-foreground">
          {fullOutput
            ? "상담 메모나 녹음 파일을 입력하면 내부 요약, 고객 전달용 요약, 필요 자료, 후속 조치를 정리해 드립니다."
            : "상담 메모나 녹음 파일을 입력하면 세무사 내부용 요약과 후속 조치를 정리해 드립니다."}
        </p>
      </div>
      <ConsultationForm
        fullConsultationOutput={fullOutput}
        canSelectClient={ctx.capabilities.clientProfiles}
        canAssignFollowUps={canAssignFollowUps}
        orgMembers={orgMembers}
        initialClientId={params.clientId ?? null}
      />
    </div>
  );
}
