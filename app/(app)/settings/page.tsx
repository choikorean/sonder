import Link from "next/link";

import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { PhrasesSettingsForm } from "@/components/settings/phrases-settings-form";
import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "설정",
};

const SETTINGS_LINKS = [
  { href: "/settings", label: "일반 설정" },
  { href: "/settings/billing", label: "결제 및 구독" },
] as const;

export default async function SettingsPage() {
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);
  const canEditProfile =
    ctx.capabilities.officeSignature || ctx.subscription.isTrialing;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="text-sm text-muted-foreground">
          사무소 프로필과 자주 쓰는 문구를 관리합니다.
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
        <ProfileSettingsForm canEdit={canEditProfile} />
        <PhrasesSettingsForm />
      </div>
    </div>
  );
}
