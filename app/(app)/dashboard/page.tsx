import Link from "next/link";
import {
  FileText,
  MessagesSquare,
  Receipt,
  History,
  Inbox,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { TAX_TYPE_LABELS, type TaxType } from "@/lib/constants";

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
      .select("id, tax_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("consultation_summaries")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("report_explanations")
      .select("id, tax_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const items: RecentItem[] = [
    ...(requests.data ?? []).map((row) => ({
      id: row.id,
      label: `자료 요청 · ${taxLabel(row.tax_type)}`,
      href: "/history",
      createdAt: row.created_at,
    })),
    ...(consultations.data ?? []).map((row) => ({
      id: row.id,
      label: "상담 요약",
      href: "/history",
      createdAt: row.created_at,
    })),
    ...(reports.data ?? []).map((row) => ({
      id: row.id,
      label: `신고 결과 설명문 · ${taxLabel(row.tax_type)}`,
      href: "/history",
      createdAt: row.created_at,
    })),
  ];

  return items
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);
}

export default async function DashboardPage() {
  const recentItems = await getRecentItems();

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="text-sm text-muted-foreground">사용할 기능을 선택하세요.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => {
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
