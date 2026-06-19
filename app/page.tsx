import Link from "next/link";
import {
  FileText,
  MessagesSquare,
  Receipt,
  Clock,
  RefreshCw,
  ClipboardList,
  Check,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { REVIEW_DISCLAIMER, STARTER_PLAN } from "@/lib/constants";

const FEATURES = [
  {
    icon: FileText,
    title: "자료 요청 생성",
    description:
      "세목과 사업 유형만 선택하면 거래처에 보낼 자료 요청문이 완성됩니다.",
  },
  {
    icon: MessagesSquare,
    title: "상담 요약",
    description:
      "상담 메모나 녹음을 정리해 내부 요약·고객 전달용 요약·후속 조치를 만들어 드립니다.",
  },
  {
    icon: Receipt,
    title: "신고 결과 설명문",
    description:
      "세액 변동 내역을 고객이 이해하기 쉬운 설명문으로 자동 작성합니다.",
  },
];

const PROBLEMS = [
  { icon: ClipboardList, text: "거래처마다 반복되는 자료 요청 작성" },
  { icon: RefreshCw, text: "누락 자료 재요청과 상담 내용 정리" },
  { icon: Clock, text: "신고 결과 설명에 드는 반복 업무 시간" },
];

const PLAN_FEATURES = [
  `자료 요청 생성 월 ${STARTER_PLAN.limits.request_generation.toLocaleString()}회`,
  `상담 요약 월 ${STARTER_PLAN.limits.consultation_summary.toLocaleString()}회`,
  `신고 결과 설명문 월 ${STARTER_PLAN.limits.report_explanation.toLocaleString()}회`,
  "모든 결과 복사 및 생성 내역 보관",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="text-lg font-bold tracking-tight">TaxFlow</span>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              로그인
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-block rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
            세무사를 위한 업무 자동화 SaaS
          </span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
            반복되는 고객 커뮤니케이션,
            <br />
            TaxFlow로 자동화하세요
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            자료 요청문, 상담 요약, 신고 결과 설명문을 몇 초 만에 생성합니다.
            세무사가 검토 후 고객에게 바로 전달할 수 있는 초안을 만들어 드립니다.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              무료로 시작하기
            </Link>
            <Link
              href="#features"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              기능 살펴보기
            </Link>
          </div>
        </section>

        {/* Problem */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight">
              신고 시즌, 이런 업무에 시간을 쓰고 계신가요?
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {PROBLEMS.map((problem) => {
                const Icon = problem.icon;
                return (
                  <div
                    key={problem.text}
                    className="flex flex-col items-center gap-3 rounded-xl bg-background px-6 py-8 text-center ring-1 ring-foreground/10"
                  >
                    <Icon className="size-6 text-muted-foreground" />
                    <p className="text-sm">{problem.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Solution / Features */}
        <section id="features" className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              세 가지 핵심 기능
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              문서 작성 중심의 반복 업무를 AI가 대신합니다. 세무사는 검토와 발송에만
              집중하세요.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="h-full">
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                간단한 요금제
              </h2>
              <p className="mt-3 text-muted-foreground">
                필요한 기능을 하나의 플랜으로 제공합니다.
              </p>
            </div>
            <div className="mx-auto mt-10 max-w-md">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {STARTER_PLAN.name}
                  </CardTitle>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {STARTER_PLAN.priceKrw.toLocaleString()}원
                    </span>
                    <span className="text-sm text-muted-foreground">/ 월</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {PLAN_FEATURES.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <Check className="size-4 shrink-0 text-foreground" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={cn(buttonVariants({ size: "lg" }), "w-full")}
                  >
                    시작하기
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            지금 바로 업무 시간을 줄여보세요
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            가입 후 첫 자료 요청문을 1분 안에 만들어 보실 수 있습니다.
          </p>
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "lg" }), "mt-8")}
          >
            무료로 시작하기
          </Link>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl space-y-2 px-4 py-8 sm:px-6">
          <p className="text-sm font-semibold">TaxFlow</p>
          <p className="text-xs text-muted-foreground">{REVIEW_DISCLAIMER}</p>
          <p className="text-xs text-muted-foreground">
            본 서비스는 세법 판단을 제공하지 않습니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
