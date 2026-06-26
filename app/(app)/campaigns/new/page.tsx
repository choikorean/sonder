import Link from "next/link";

import { CampaignCreateForm } from "@/components/campaigns/campaign-create-form";
import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";

export const metadata = {
  title: "새 자료 요청 캠페인",
};

export default async function CampaignNewPage() {
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);

  if (!ctx.capabilities.clientProfiles) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">새 자료 요청 캠페인</h1>
        <p className="text-sm text-muted-foreground">
          Pro·Team 요금제에서 이용할 수 있습니다.{" "}
          <Link href="/billing" className="underline">
            요금제 보기
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">새 자료 요청 캠페인</h1>
        <p className="text-sm text-muted-foreground">
          시즌 프리셋을 선택하고 거래처를 지정하면 제출 상태를 추적할 수 있습니다.
        </p>
      </div>
      <CampaignCreateForm />
    </div>
  );
}
