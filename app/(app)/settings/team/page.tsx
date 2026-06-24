import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { TeamSettingsForm } from "@/components/settings/team-settings-form";
import { SETTINGS_LINKS } from "@/lib/settings-nav";
import { cn } from "@/lib/utils";

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

      <nav className="flex flex-wrap gap-2">
        {SETTINGS_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted",
              item.href === "/settings/team"
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

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
