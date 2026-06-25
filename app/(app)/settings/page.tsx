import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { PhrasesSettingsForm } from "@/components/settings/phrases-settings-form";
import { SettingsNav } from "@/components/settings/settings-nav";

export const metadata = {
  title: "설정",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);
  const canEditProfile = ctx.capabilities.officeSignature;

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

      <SettingsNav
        activeHref="/settings"
        canManageBilling={ctx.canManageBilling}
      />

      <div className="space-y-6">
        <ProfileSettingsForm canEdit={canEditProfile} />
        <PhrasesSettingsForm />
      </div>
    </div>
  );
}
