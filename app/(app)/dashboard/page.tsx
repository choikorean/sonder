import Link from "next/link";
import {
  CalendarDays,
  FileText,
  FolderKanban,
  ListTodo,
  MessagesSquare,
  Receipt,
  History,
  Inbox,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { assertCampaignAccess, getCampaignDashboardStats } from "@/lib/document-campaign/service";
import { getFollowUpDashboardStats } from "@/lib/follow-up/service";
import { getSubscriberContext } from "@/lib/subscriber-context";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { TAX_TYPE_LABELS, FEATURE_LABELS, type TaxType } from "@/lib/constants";
import { getUsageStatus, getMonthlyUsageByFeature } from "@/lib/usage";
import { formatScheduleDate } from "@/lib/tax-schedule/calendar";
import { getUpcomingTaxScheduleEvents } from "@/lib/tax-schedule/queries";

export const metadata = {
  title: "대시보드",
};

const FEATURES = [
  {
    href: "/requests",
    title: "자료 요청 생성",
    description: "거래처에 보낼 자료 요청문을 생성합니다.",
    icon: FileText,
  },
  {
    href: "/consultations",
    title: "상담 요약",
    description: "상담 내용을 요약하고 후속 조치를 정리합니다.",
    icon: MessagesSquare,
  },
  {
    href: "/reports",
    title: "신고 결과 설명문",
    description: "신고 결과를 고객이 이해하기 쉽게 설명합니다.",
    icon: Receipt,
  },
  {
    href: "/history",
    title: "생성 내역",
    description: "이전에 생성한 결과를 다시 확인합니다.",
    icon: History,
  },
] as const;

type RecentItem = {
  id: string;
  label: string;
  href: string;
  createdAt: string;
  clientName: string | null;
};

function taxLabel(value: string) {
  return TAX_TYPE_LABELS[value as TaxType] ?? value;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getRecentItems(): Promise<RecentItem[]> {
  const supabase = await createClient();

  const [requests, consultations, reports] = await Promise.all([
    supabase
      .from("request_generations")
      .select("id, tax_type, created_at, client_id")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("consultation_summaries")
      .select("id, created_at, client_id")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("report_explanations")
      .select("id, tax_type, created_at, client_id")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const clientIds = [
    ...(requests.data ?? []).map((row) => row.client_id),
    ...(consultations.data ?? []).map((row) => row.client_id),
    ...(reports.data ?? []).map((row) => row.client_id),
  ].filter((id): id is string => id != null);

  const clientNameMap = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name")
      .in("id", [...new Set(clientIds)]);

    for (const client of clients ?? []) {
      clientNameMap.set(client.id, client.name);
    }
  }

  const items: RecentItem[] = [
    ...(requests.data ?? []).map((row) => {
      const clientName = row.client_id
        ? (clientNameMap.get(row.client_id) ?? null)
        : null;
      return {
        id: row.id,
        label: clientName
          ? `자료 요청 · ${taxLabel(row.tax_type)} · ${clientName}`
          : `자료 요청 · ${taxLabel(row.tax_type)}`,
        href: row.client_id
          ? `/history?clientId=${row.client_id}`
          : "/history",
        createdAt: row.created_at,
        clientName,
      };
    }),
    ...(consultations.data ?? []).map((row) => {
      const clientName = row.client_id
        ? (clientNameMap.get(row.client_id) ?? null)
        : null;
      return {
        id: row.id,
        label: clientName ? `상담 요약 · ${clientName}` : "상담 요약",
        href: row.client_id
          ? `/history?clientId=${row.client_id}`
          : "/history",
        createdAt: row.created_at,
        clientName,
      };
    }),
    ...(reports.data ?? []).map((row) => {
      const clientName = row.client_id
        ? (clientNameMap.get(row.client_id) ?? null)
        : null;
      return {
        id: row.id,
        label: clientName
          ? `신고 결과 설명문 · ${taxLabel(row.tax_type)} · ${clientName}`
          : `신고 결과 설명문 · ${taxLabel(row.tax_type)}`,
        href: row.client_id
          ? `/history?clientId=${row.client_id}`
          : "/history",
        createdAt: row.created_at,
        clientName,
      };
    }),
  ];

  return items
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);
}

const FEATURE_ORDER = [
  "request_generation",
  "consultation_summary",
  "report_explanation",
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);
  const [recentItems, usage, byFeature, upcomingSchedule, campaignStats, followUpStats] =
    await Promise.all([
    getRecentItems(),
    getUsageStatus(supabase),
    getMonthlyUsageByFeature(supabase),
    getUpcomingTaxScheduleEvents(supabase, 5),
    (async () => {
      if (!ctx.capabilities.clientProfiles) {
        return null;
      }
      try {
        const scope = assertCampaignAccess(ctx);
        return getCampaignDashboardStats(supabase, {
          organizationId: scope.organizationId,
          userId: (await supabase.auth.getUser()).data.user?.id ?? "",
        });
      } catch {
        return null;
      }
    })(),
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      try {
        return getFollowUpDashboardStats(supabase, {
          ctx,
          userId: user.id,
        });
      } catch {
        return null;
      }
    })(),
  ]);

  const featureCards = [
    ...FEATURES,
    ...(ctx.capabilities.clientProfiles
      ? [
          {
            href: "/campaigns",
            title: "자료 요청 캠페인",
            description: "시즌별 거래처 자료 요청·재요청·제출 상태를 관리합니다.",
            icon: FolderKanban,
          },
          {
            href: "/settings/clients",
            title: "고객 관리",
            description: "거래처를 등록하고 생성·이력을 연결합니다.",
            icon: Users,
          },
        ]
      : []),
  ];

  const percent =
    usage.limit > 0
      ? Math.min(100, Math.round((usage.used / usage.limit) * 100))
      : 0;

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="text-sm text-muted-foreground">사용할 기능을 선택하세요.</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{usage.usagePeriodLabel}</h2>
          <Link
            href="/billing"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {usage.plan.name} 플랜
          </Link>
        </div>
        <Card className="p-4">
          {usage.trialExpired && (
            <p className="mb-4 text-sm text-muted-foreground">
              무료 체험 기간이 종료되었습니다. 생성 내역은 조회할 수 있으며, 계속
              이용하려면 요금제를 선택해 주세요.
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">전체 생성</span>
            <span>
              <span
                className={
                  usage.allowed
                    ? "font-semibold text-foreground"
                    : "font-semibold text-destructive"
                }
              >
                {usage.used.toLocaleString()}
              </span>
              {" / "}
              {usage.limit.toLocaleString()}건
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${usage.allowed ? "bg-foreground" : "bg-destructive"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-3">
            {FEATURE_ORDER.map((feature) => (
              <div key={feature} className="flex items-center justify-between text-sm sm:flex-col sm:items-start sm:gap-1">
                <span className="text-muted-foreground">
                  {FEATURE_LABELS[feature]}
                </span>
                <span className="font-medium">
                  {byFeature[feature].toLocaleString()}건
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {followUpStats && followUpStats.pendingCount > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">상담 후속 조치</h2>
            <Link
              href="/follow-ups"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              후속 조치 관리
            </Link>
          </div>
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <ListTodo className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">미완료 후속</p>
                  <p className="text-2xl font-bold">
                    {followUpStats.pendingCount.toLocaleString()}건
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {campaignStats && campaignStats.activeCampaigns > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">자료 요청 캠페인</h2>
            <Link
              href="/campaigns"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              캠페인 관리
            </Link>
          </div>
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <FolderKanban className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">미제출·후속 필요</p>
                  <p className="text-2xl font-bold">
                    {campaignStats.pendingItems.toLocaleString()}건
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                진행 중 캠페인 {campaignStats.activeCampaigns.toLocaleString()}개
              </p>
            </div>
          </Card>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">이번 달 세무일정</h2>
          <Link
            href="/schedule"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            전체 보기
          </Link>
        </div>

        {upcomingSchedule.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="다가오는 일정이 없습니다"
            description="국세청 일정이 동기화되면 이곳에 표시됩니다."
            action={
              <Link
                href="/schedule"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                세무일정 메뉴로 이동
              </Link>
            }
          />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {upcomingSchedule.map((event) => (
                <li key={event.id}>
                  <Link
                    href="/schedule"
                    className="flex items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm">{event.title}</p>
                      {event.taxCategories.length > 0 && (
                        <p className="truncate text-xs text-muted-foreground">
                          {event.taxCategories
                            .map((category) => taxLabel(category))
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatScheduleDate(event.eventDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {featureCards.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href} className="group">
              <Card className="h-full transition-colors group-hover:bg-muted/40 group-hover:ring-foreground/20">
                <CardHeader>
                  <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 생성 내역</h2>
          {recentItems.length > 0 && (
            <Link
              href="/history"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              전체 보기
            </Link>
          )}
        </div>

        {recentItems.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="아직 생성한 내역이 없습니다"
            description="위 기능을 선택해 첫 문서를 생성해 보세요."
          />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {recentItems.map((item) => (
                <li key={`${item.label}-${item.id}`}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="truncate text-sm">{item.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
