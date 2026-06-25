import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { TeamSettingsForm } from "@/components/settings/team-settings-form";
import { SettingsNav } from "@/components/settings/settings-nav";

export const metadata = {
  title: "팀 관리",
};

export default async function TeamSettingsPage() {
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">팀 관리</h1>
        <p className="text-sm text-muted-foreground">
          Team 플랜 사무소의 팀원 초대와 좌석 사용 현황을 관리합니다.
        </p>
      </div>

      <SettingsNav
        activeHref="/settings/team"
        canManageBilling={ctx.canManageBilling}
      />

      {ctx.subscription.effectivePlanId !== "team" ||
      !ctx.subscription.isActive ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Team 요금제를 구독하면 최대 5인 계정과 사용자별 생성 이력 공유를 이용할
          수 있습니다.{" "}
          <Link
            href="/billing"
            className="font-medium text-foreground underline underline-offset-4"
          >
            요금제 보기
          </Link>
        </div>
      ) : null}

      <TeamSettingsForm />
    </div>
  );
}
