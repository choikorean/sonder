import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { getSupportConfig, getSupportTier } from "@/lib/support";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { PhrasesSettingsForm } from "@/components/settings/phrases-settings-form";
import { PrioritySupportCard } from "@/components/support/priority-support-card";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "설정",
};

const SETTINGS_LINKS = [
  { href: "/settings", label: "일반 설정" },
  { href: "/settings/team", label: "팀 관리" },
  { href: "/settings/billing", label: "결제 및 구독" },
] as const;

export default async function SettingsPage() {
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);
  const canEditProfile = ctx.capabilities.officeSignature;
  const support = getSupportConfig();
  const supportTier = getSupportTier({
    prioritySupport: ctx.capabilities.prioritySupport,
    planId: ctx.subscription.planId,
    isTrialing: ctx.subscription.isTrialing,
  });

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="text-sm text-muted-foreground">
          {canEditProfile
            ? "사무소 프로필은 자료 요청문·신고 결과 설명문 등 생성 결과에 반영됩니다."
            : "사무소 프로필 자동 삽입은 Pro 플랜 이상에서 이용할 수 있습니다."}
        </p>
      </div>

      <nav className="flex gap-2">
        {SETTINGS_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted",
              item.href === "/settings"
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-6">
        {supportTier !== "none" && (
          <PrioritySupportCard
            tier={supportTier}
            priorityEmail={support.priorityEmail}
            teamOnboardingUrl={support.teamOnboardingUrl}
          />
        )}
        <ProfileSettingsForm canEdit={canEditProfile} />
        <PhrasesSettingsForm />
      </div>
    </div>
  );
}
