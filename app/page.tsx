import Link from "next/link";
import {
  FileText,
  MessagesSquare,
  Receipt,
  Check,
  X,
  PhoneCall,
  HelpCircle,
  TrendingUp,
  NotebookPen,
  ArrowRight,
  Quote,
  Users,
  FolderKanban,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";
import { PLANS, PURCHASABLE_PLAN_IDS, formatKrw } from "@/lib/plans";

const PAINS = [
  {
    icon: PhoneCall,
    title: "“자료 아직 안 보내주셨어요.”",
    body: "부가세·종소세·법인세 시즌마다 거래처에 같은 말을 반복합니다. 결국 다시 연락하고, 다시 설명하고, 다시 확인합니다.",
  },
  {
    icon: HelpCircle,
    title: "“홈택스에 다 있는 거 아닌가요?”",
    body: "거래처는 왜 이 자료가 필요한지 모릅니다. 자료 요청보다 더 피곤한 건 왜 줘야 하는지 매번 설명하는 일입니다.",
  },
  {
    icon: TrendingUp,
    title: "“세금이 왜 이렇게 많이 나왔나요?”",
    body: "신고가 끝나도 일이 끝나지 않습니다. 고객이 이해할 수 있게 결과를 풀어 쓰는 데 또 시간이 듭니다.",
  },
  {
    icon: NotebookPen,
    title: "상담은 끝났는데, 정리가 남습니다.",
    body: "상담 요약, 고객 요약문, 직원 업무 지시, 추가 자료 정리, 다음 일정 안내. 바쁠 때 가장 쉽게 누락됩니다.",
  },
];

const AGITATIONS = [
  "거래처별로 조금씩 다른 문구를 매번 다시 쓰는 일",
  "자료를 안 준 거래처를 엑셀·메모로 다시 확인하는 일",
  "「홈택스에 다 있는 거 아닌가요?」를 매번 설명하는 일",
  "상담 내용을 고객용으로 다시 정리하는 일",
  "상담 후 내부 후속 조치를 놓치는 일",
  "신고 결과를 고객 눈높이에 맞게 설명하는 일",
];

const FEATURES = [
  {
    icon: FileText,
    title: "자료 요청문 · 재요청문 생성",
    description:
      "세목과 거래처 유형만 선택하면 바로 보낼 수 있는 자료 요청문을 생성합니다. 각 자료가 왜 필요한지, 홈택스만으로 부족할 수 있는 이유까지 함께 안내할 수 있습니다.",
    inputLabel: "입력 예시",
    inputs: ["부가세", "개인사업자", "온라인 쇼핑몰", "미제출 통장·카드 내역"],
    outputLabel: "생성 결과",
    outputs: [
      "거래처에 보낼 자료 요청 안내문",
      "항목별 자료 필요 이유 안내",
      "누락되기 쉬운 자료 목록·제출 기한",
      "미제출 건 전용 재요청문",
      "「홈택스 FAQ」형 자료 설명문 (단독 생성)",
    ],
  },
  {
    icon: FolderKanban,
    title: "자료 요청 캠페인 · 미제출 추적",
    description:
      "시즌별로 거래처 자료 요청을 묶어 관리합니다. 고객별 제출 상태를 추적하고, 미제출 건만 골라 재요청문을 일괄 생성할 수 있습니다.",
    planNote:
      "Pro·Team 플랜(무료 체험 포함)에서 이용할 수 있습니다. 국세청 세무일정을 참고해 시즌 프리셋과 제출 기한을 채울 수 있습니다.",
    inputLabel: "입력 예시",
    inputs: ["1기 부가세 확정", "대상 거래처 30곳", "미제출 통장·카드"],
    outputLabel: "활용",
    outputs: [
      "고객별 요청·제출 상태 (미요청/요청함/일부제출/완료/재요청)",
      "미제출 거래처만 재요청문 생성",
      "선택 거래처 일괄 자료 요청문 생성",
      "대시보드 미제출·후속 필요 건수 확인",
    ],
  },
  {
    icon: MessagesSquare,
    title: "상담 내용 정리 · 후속 조치",
    description:
      "상담 메모를 붙여넣으면 세무사 업무 흐름에 맞게 정리합니다. 내부 후속 조치는 체크리스트로 남기고, 추가 자료는 자료 요청문 생성으로 바로 이어갈 수 있습니다.",
    planNote:
      "Starter는 상담 요약·내부 후속 조치만 제공합니다. 고객 전달용 정리문·추가 자료·다음 안내·후속 체크리스트·상담→자료요청 연계는 Pro 이상에서 이용할 수 있습니다.",
    inputLabel: "입력 예시",
    inputs: ["상담 메모", "통화 내용", "방문 상담 기록"],
    outputLabel: "생성 결과",
    outputs: [
      "상담 요약",
      "고객에게 보낼 정리문 (Pro 이상)",
      "추가로 받아야 할 자료 (Pro 이상)",
      "내부 후속 조치 → 체크리스트 자동 생성",
      "자료 요청문·자료 설명문으로 원클릭 연계 (Pro 이상)",
    ],
  },
  {
    icon: Receipt,
    title: "신고 결과 설명문 생성",
    description:
      "신고 결과와 변동 사유를 입력하면 고객이 이해하기 쉬운 설명문을 생성합니다. 국세청 일정을 참고해 납부기한을 제안하고, 금액·변동·납부 안내를 섹션별로 복사할 수 있습니다.",
    inputLabel: "입력 예시",
    inputs: ["납부세액", "전기 대비 증감", "매출 증가·공제 감소 칩", "분납 안내"],
    outputLabel: "생성 결과",
    outputs: [
      "금액 요약 · 변동 사유 · 납부 안내 (섹션별 복사)",
      "전년 대비 변동 사유 설명",
      "국세청 일정 기반 납부기한 제안",
      "카카오톡용 전체 설명문 초안",
    ],
  },
  {
    icon: Users,
    title: "고객 등록 · 고객별 이력",
    description:
      "거래처 정보를 등록해 두고 생성·캠페인·상담·이력을 연결합니다. 호칭·사업 유형이 반영된 문구를 만들고, 고객별 생성 내역을 한곳에서 조회할 수 있습니다.",
    planNote:
      "Starter에는 포함되지 않습니다. Pro는 최대 20명, Team은 사무소 공유 최대 200명까지 등록할 수 있습니다.",
    inputLabel: "등록 예시",
    inputs: ["상호명", "담당자", "사업 유형", "연락처", "거래처 메모"],
    outputLabel: "활용",
    outputs: [
      "자료 요청·상담·설명문 생성 시 고객 선택",
      "자료 요청 캠페인 대상 거래처 관리",
      "생성 내역에서 고객별 조회",
    ],
  },
];

const BEFORE = [
  "거래처별 자료 요청문 작성",
  "누락자료 재요청·미제출 확인",
  "「왜 필요한가요?」 설명",
  "상담 후 메모·후속 조치 정리",
  "고객에게 다시 요약 전달",
  "신고 결과 설명문 작성",
  "카톡 문구 복붙 후 수정",
];

const AFTER = [
  "세목·시즌 프리셋 선택",
  "거래처 유형·특이사항 입력",
  "AI 초안 생성 (이유·기한 포함)",
  "캠페인으로 미제출 추적",
  "후속 조치 체크리스트 확인",
  "세무사가 검토 후 발송",
];

const USE_CASES = [
  {
    title: "부가세 신고 전",
    items: [
      "자료 요청 캠페인으로 거래처별 상태 관리",
      "미제출 거래처만 재요청문 일괄 생성",
      "자료 필요 이유·홈택스 FAQ 설명문 생성",
    ],
  },
  {
    title: "종합소득세 시즌",
    items: [
      "시즌 프리셋으로 제출 기한·메모 자동 채움",
      "인건비·임대료·카드자료 누락 방지 안내",
      "국세청 세무일정 달력으로 마감 확인",
    ],
  },
  {
    title: "신규 수임 상담 후",
    planNote:
      "Starter는 내부 요약만, Pro 이상은 고객 전달용 정리문·후속 체크리스트·자료요청 연계까지 제공합니다.",
    items: [
      "상담 내용 요약·고객 전달용 정리문 (Pro 이상)",
      "후속 조치 체크리스트로 누락 방지",
      "추가 자료 목록 → 자료 요청문 원클릭 생성",
    ],
  },
  {
    title: "신고 완료 후",
    items: [
      "변동 사유 칩으로 빠른 입력 후 설명문 생성",
      "금액·변동·납부 안내 섹션별 복사",
      "국세청 일정 기반 납부기한 제안",
    ],
  },
];

const VALUE_ITEMS = [
  "자료 요청문 작성 시간",
  "미제출 거래처 확인·재요청 시간",
  "자료 필요 이유 설명 시간",
  "상담 후 정리·후속 조치 시간",
  "신고 결과 설명문 작성 시간",
  "거래처별 카톡 문구 수정 시간",
];

const TRUST_NOT = [
  "세법 자문 자동화",
  "세액 자동 계산",
  "신고서 자동 작성",
  "홈택스 자동 신고",
  "세무사 판단 대체",
];

const TRUST_DO = [
  "세무사가 검토할 고객 안내문 초안 생성",
  "상담 내용을 구조화·후속 체크리스트화",
  "시즌별 자료 요청·미제출 상태 추적",
  "필요한 자료 목록·이유 설명 정리",
  "신고 결과 설명문 초안 작성",
  "반복 커뮤니케이션 시간 절감",
];

const TESTIMONIALS = [
  {
    role: "개인 세무사 사무소 대표",
    quote:
      "자료 요청 문구를 매번 복붙하고 수정하는 시간이 꽤 컸는데, 초안이 바로 나오니 신고 시즌에 체감이 있습니다.",
  },
  {
    role: "1인 세무사",
    quote:
      "세법 판단은 제가 하지만, 고객에게 설명하는 문장을 만드는 데 시간이 많이 걸렸습니다. 그 부분이 줄어드는 게 좋았습니다.",
  },
  {
    role: "소형 세무법인 실무자",
    quote:
      "상담 후 후속 조치가 체크리스트로 남고, 추가 자료는 자료 요청문으로 바로 이어져서 직원에게 전달하기가 편합니다.",
  },
];

const FAQS = [
  {
    q: "TaxFlo가 세무 상담을 대신하나요?",
    a: "아닙니다. TaxFlo는 세무사의 판단을 대신하지 않습니다. 세무사가 검토할 문서 초안을 만들어주는 도구입니다.",
  },
  {
    q: "홈택스나 세무 프로그램과 연동되나요?",
    a: "현재는 연동 없이 사용할 수 있습니다. 자료 요청, 상담 정리, 설명문 작성처럼 바로 체감되는 업무부터 지원합니다.",
  },
  {
    q: "카카오톡으로 바로 보낼 수 있나요?",
    a: "생성된 문구를 복사해서 카카오톡, 문자, 이메일 등 원하는 채널에 붙여넣을 수 있습니다.",
  },
  {
    q: "직원도 사용할 수 있나요?",
    a: "Team 플랜에서 최대 5인 계정을 지원합니다. 개인 세무사는 Starter·Pro 플랜으로 시작하실 수 있습니다.",
  },
  {
    q: "거래처(고객) 정보를 저장할 수 있나요?",
    a: "Pro·Team 플랜(무료 체험 포함)에서 고객을 등록할 수 있습니다. Pro는 최대 20명, Team은 사무소 전체가 공유하는 고객 최대 200명까지 등록할 수 있습니다. Starter 플랜에는 고객 등록·고객별 이력 기능이 포함되지 않습니다.",
  },
  {
    q: "거래처가 많을 때 자료 요청을 어떻게 관리하나요?",
    a: "Pro·Team 플랜에서는 자료 요청 캠페인으로 시즌별 대상 거래처를 묶고, 고객별 제출 상태를 추적할 수 있습니다. 미제출 건만 골라 재요청문을 생성하거나 일괄 자료 요청문을 만들 수 있습니다.",
  },
  {
    q: "상담 후 놓치기 쉬운 후속 조치는 어떻게 하나요?",
    a: "상담 요약 생성 시 내부 후속 조치가 체크리스트로 자동 등록됩니다. 완료 처리하고, 추가 자료가 필요하면 자료 요청문 생성 화면으로 바로 이어갈 수 있습니다. Team 플랜에서는 후속 조치를 팀원에게 배정할 수도 있습니다.",
  },
  {
    q: "AI가 틀린 내용을 작성하면 어떻게 하나요?",
    a: "모든 결과물은 초안입니다. 발송 전 세무사가 반드시 검토해야 합니다. TaxFlo는 최종 판단이나 세무 자문을 제공하지 않습니다.",
  },
  {
    q: "어떤 세무사에게 적합한가요?",
    a: "거래처 자료 요청이 반복되고, 카톡·이메일 응대가 많으며, 상담 후 정리와 신고 결과 설명문 작성에 시간이 드는 세무사에게 적합합니다.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="text-lg font-bold tracking-tight">TaxFlo</span>
          <nav className="hidden items-center gap-1 md:flex">
            <a
              href="#features"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              기능
            </a>
            <a
              href="#pricing"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              요금제
            </a>
            <a
              href="#faq"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              자주 묻는 질문
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              로그인
            </Link>
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
              무료로 시작하기
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 1. Hero */}
        <section className="mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-block rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
            세무사를 위한 고객 커뮤니케이션 자동화 도구
          </span>
          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            신고 마감일마다 거래처 자료 때문에
            <br />
            다시 쫓아다니고 계신가요?
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            TaxFlo는 자료 요청문·재요청문, 자료 필요 이유 설명, 시즌별 캠페인
            추적, 상담 정리·후속 체크리스트, 신고 결과 설명문을 세무사 업무
            흐름에 맞게 자동 생성합니다. 세법 판단은 세무사가 하고, 반복 문구
            작성은 TaxFlo가 초안을 만듭니다.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              무료 체험 신청하기
            </Link>
            <a
              href="#features"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              기능 살펴보기
            </a>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            신용카드 등록 없음 · 설치 없음 · 3분 내 사용 가능
          </p>
        </section>

        {/* 2. Pain */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              세무사님, 이런 일이 매번 반복되지 않나요?
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {PAINS.map((pain) => {
                const Icon = pain.icon;
                return (
                  <div
                    key={pain.title}
                    className="flex gap-4 rounded-xl bg-background p-6 ring-1 ring-foreground/10"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{pain.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {pain.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. Problem Agitation */}
        <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              세무사가 힘든 이유는 세법 때문만이 아닙니다.
            </h2>
            <p className="mt-3 text-muted-foreground">
              진짜 반복되는 피로는 이런 일입니다.
            </p>
          </div>
          <ul className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
            {AGITATIONS.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-lg border border-border px-4 py-4 text-sm font-medium"
              >
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-8 max-w-2xl text-center text-muted-foreground">
            이 일들은 중요하지만, 매번 세무사가 처음부터 작성할 필요는 없습니다.
          </p>
        </section>

        {/* 4. Solution / Features */}
        <section
          id="features"
          className="scroll-mt-16 border-t border-border bg-muted/30"
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                TaxFlo가 반복 문구의 초안을 만들어드립니다.
              </h2>
              <p className="mt-3 text-muted-foreground">
                세법 판단을 대신하지 않습니다. 세무사가 이미 알고 있는 내용을
                고객에게 보낼 수 있는 문장으로 빠르게 정리합니다.
              </p>
            </div>
            <div className="mt-12 space-y-5">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                          <Icon className="size-5" />
                        </div>
                        <CardTitle className="text-lg">
                          {feature.title}
                        </CardTitle>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                      {"planNote" in feature && feature.planNote && (
                        <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                          {feature.planNote}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {feature.inputLabel}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {feature.inputs.map((input) => (
                              <span
                                key={input}
                                className="rounded-full border border-border px-3 py-1 text-xs"
                              >
                                {input}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {feature.outputLabel}
                          </p>
                          <ul className="mt-3 space-y-2">
                            {feature.outputs.map((output) => (
                              <li
                                key={output}
                                className="flex items-start gap-2 text-sm"
                              >
                                <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                                <span>{output}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Before / After */}
        <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-border p-6">
              <p className="text-sm font-medium text-muted-foreground">
                TaxFlo 사용 전
              </p>
              <p className="mt-1 font-semibold">
                신고 시즌마다 반복됩니다.
              </p>
              <ul className="mt-5 space-y-2">
                {BEFORE.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-foreground bg-muted/30 p-6 ring-1 ring-foreground/10">
              <p className="text-sm font-medium text-muted-foreground">
                TaxFlo 사용 후
              </p>
              <p className="mt-1 font-semibold">
                반복 문구는 초안부터 시작합니다.
              </p>
              <ul className="mt-5 space-y-2">
                {AFTER.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-muted-foreground">
            세무사는 판단에 집중하고, TaxFlo는 반복 작성 시간을 줄입니다.
          </p>
        </section>

        {/* 6. Use Cases */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              이런 상황에서 바로 쓸 수 있습니다.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {USE_CASES.map((useCase) => (
                <div
                  key={useCase.title}
                  className="rounded-xl bg-background p-6 ring-1 ring-foreground/10"
                >
                  <p className="font-semibold">{useCase.title}</p>
                  {"planNote" in useCase && useCase.planNote && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {useCase.planNote}
                    </p>
                  )}
                  <ul className="mt-4 space-y-2">
                    {useCase.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Value Proposition */}
        <section className="mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6">
          <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
            하루 30분만 줄어도, 한 달이면 10시간 이상입니다.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            세무사님이 직접 하지 않아도 되는 반복 문구 작성. 이제 매번 처음부터
            쓰지 마세요.
          </p>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
            {VALUE_ITEMS.map((item) => (
              <span
                key={item}
                className="rounded-full border border-border px-4 py-2 text-sm"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-sm text-muted-foreground">
            단순한 AI 채팅이 아니라, 세무사 업무에 맞춘 문서 생성 흐름입니다.
          </p>
        </section>

        {/* 8. Trust */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
            <h2 className="mx-auto max-w-2xl text-center text-2xl font-bold tracking-tight sm:text-3xl">
              세무 판단은 하지 않습니다. 그래서 더 안전하게 시작할 수 있습니다.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl bg-background p-6 ring-1 ring-foreground/10">
                <p className="font-semibold">TaxFlo가 하지 않는 것</p>
                <ul className="mt-4 space-y-2">
                  {TRUST_NOT.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-background p-6 ring-1 ring-foreground/10">
                <p className="font-semibold">TaxFlo가 하는 것</p>
                <ul className="mt-4 space-y-2">
                  {TRUST_DO.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
              모든 결과물은 초안입니다. 발송 전 세무사가 반드시 검토합니다.
            </p>
          </div>
        </section>

        {/* 9. Testimonials */}
        <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            베타 사용자 피드백
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <Card key={testimonial.role} className="h-full">
                <CardContent className="flex h-full flex-col gap-4 pt-6">
                  <Quote className="size-6 text-muted-foreground" />
                  <p className="flex-1 text-sm leading-relaxed">
                    “{testimonial.quote}”
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {testimonial.role}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 10. Pricing */}
        <section
          id="pricing"
          className="scroll-mt-16 border-t border-border bg-muted/30"
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                무료 체험 후 결정하세요.
              </h2>
              <p className="mt-3 text-muted-foreground">
                신용카드 없이 14일 무료 체험으로 먼저 확인하세요. 체험 기간
                동안 생성 30건·기록 14일 보관만 제한되며, Pro·Team 기능(자료
                캠페인·고객 등록 포함)을 모두 이용할 수 있습니다. 연 결제 시
                2개월 무료입니다. (부가세 별도)
              </p>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {PURCHASABLE_PLAN_IDS.map((planId) => {
                const plan = PLANS[planId];
                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "relative h-full overflow-visible",
                      plan.highlight &&
                        "border-foreground ring-1 ring-foreground/10",
                    )}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 left-6 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
                        {plan.badge}
                      </span>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {plan.tagline}
                      </p>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          {formatKrw(plan.monthlyPrice)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / 월
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/login"
                        className={cn(
                          buttonVariants({
                            size: "lg",
                            variant: plan.highlight ? "default" : "outline",
                          }),
                          "w-full",
                        )}
                      >
                        시작하기
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* 11. FAQ */}
        <section id="faq" className="scroll-mt-16">
          <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              자주 묻는 질문
            </h2>
            <div className="mt-10 divide-y divide-border rounded-xl border border-border">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                    {faq.q}
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 12. Final CTA */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6">
            <h2 className="mx-auto max-w-2xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              이번 신고 시즌에도 거래처 자료 때문에 계속 쫓아다니실 건가요?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              자료 요청 캠페인, 미제출 추적, 상담 후속 체크리스트, 신고 결과
              설명문까지. 반복되는 문서 작성은 TaxFlo로 줄이세요. 세무사는
              판단에 집중하고, TaxFlo는 반복 커뮤니케이션 초안을 만듭니다.
            </p>
            <Link
              href="/login"
              className={cn(buttonVariants({ size: "lg" }), "mt-8")}
            >
              무료 체험 신청하기
            </Link>
            <p className="mt-5 text-sm text-muted-foreground">
              신용카드 등록 없음 · 설치 없음 · 바로 사용 가능
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
