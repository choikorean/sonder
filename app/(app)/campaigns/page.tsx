import Link from "next/link";

import { CampaignListClient } from "@/components/campaigns/campaign-list-client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";

export const metadata = {
  title: "자료 요청 캠페인",
};

export default async function CampaignsPage() {
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);
  const canUseCampaigns = ctx.capabilities.clientProfiles;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">자료 요청 캠페인</h1>
          <p className="text-sm text-muted-foreground">
            신고 시즌별로 거래처 자료 요청·재요청·제출 상태를 관리합니다.
          </p>
        </div>
        {canUseCampaigns && (
          <Link href="/campaigns/new" className={cn(buttonVariants())}>
            새 캠페인
          </Link>
        )}
      </div>

      {!canUseCampaigns ? (
        <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
          자료 캠페인은 Pro·Team 요금제(또는 무료 체험)에서 이용할 수 있습니다.{" "}
          <Link href="/billing" className="font-medium text-foreground underline">
            요금제 보기
          </Link>
        </div>
      ) : (
        <CampaignListClient />
      )}
    </div>
  );
}
