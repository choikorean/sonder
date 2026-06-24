import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { ClientsSettingsForm } from "@/components/settings/clients-settings-form";
import { SETTINGS_LINKS } from "@/lib/settings-nav";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "고객 관리",
};

export default async function SettingsClientsPage() {
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);
  const canManage = ctx.capabilities.clientProfiles;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">고객 관리</h1>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? "거래처 정보를 등록해 두면 생성 시 선택해 문구에 반영할 수 있습니다. 고객별 생성 내역은 「생성 내역」에서 조회할 수 있습니다."
            : "고객 등록은 Pro·Team 요금제에서 이용할 수 있습니다."}
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {SETTINGS_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted",
              item.href === "/settings/clients"
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <ClientsSettingsForm
        canManage={canManage}
        isTrialing={ctx.subscription.isTrialing}
      />
    </div>
  );
}
