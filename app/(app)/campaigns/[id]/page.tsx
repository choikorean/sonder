import Link from "next/link";
import { notFound } from "next/navigation";

import { CampaignDetailClient } from "@/components/campaigns/campaign-detail-client";
import {
  assertCampaignAccess,
  getDocumentCampaignDetail,
} from "@/lib/document-campaign/service";
import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";

export const metadata = {
  title: "자료 요청 캠페인",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);

  try {
    assertCampaignAccess(ctx);
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">자료 요청 캠페인</h1>
        <p className="text-sm text-muted-foreground">
          Pro·Team 요금제에서 이용할 수 있습니다.{" "}
          <Link href="/billing" className="underline">
            요금제 보기
          </Link>
        </p>
      </div>
    );
  }

  const campaign = await getDocumentCampaignDetail(supabase, id);
  if (!campaign) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/campaigns"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← 캠페인 목록
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">캠페인 상세</h1>
      </div>
      <CampaignDetailClient initialCampaign={campaign} />
    </div>
  );
}
