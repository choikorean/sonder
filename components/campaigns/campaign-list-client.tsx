"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import type { DocumentCampaign } from "@/lib/document-campaign/types";
import { TAX_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FolderKanban } from "lucide-react";

export function CampaignListClient() {
  const [campaigns, setCampaigns] = useState<DocumentCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/campaigns");
        const json = await res.json();
        if (!json.success) {
          setError(json.error);
          return;
        }
        setCampaigns(json.data.campaigns);
      } catch {
        setError("캠페인 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="아직 캠페인이 없습니다"
        description="신고 시즌별로 거래처 자료 요청 진행 상황을 관리해 보세요."
        action={
          <Link href="/campaigns/new" className={cn(buttonVariants())}>
            첫 캠페인 만들기
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
          <Card className="transition-colors hover:bg-muted/40">
            <CardHeader className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base">{campaign.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {TAX_TYPE_LABELS[campaign.taxType]}
                    {campaign.submissionDeadlineLabel
                      ? ` · 제출 기한 ${campaign.submissionDeadlineLabel}`
                      : ""}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
