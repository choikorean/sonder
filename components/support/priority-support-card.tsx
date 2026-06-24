import Link from "next/link";
import { CalendarClock, Headphones, Mail } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SupportTier } from "@/lib/support";
import {
  buildOnboardingMailto,
  buildPrioritySupportMailto,
} from "@/lib/support";

type PrioritySupportCardProps = {
  tier: SupportTier;
  priorityEmail: string;
  teamOnboardingUrl: string | null;
  compact?: boolean;
};

export function PrioritySupportCard({
  tier,
  priorityEmail,
  teamOnboardingUrl,
  compact = false,
}: PrioritySupportCardProps) {
  if (tier === "none") return null;

  const supportMailto = buildPrioritySupportMailto(priorityEmail);
  const onboardingMailto = buildOnboardingMailto(priorityEmail);

  if (compact) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">
            {tier === "team" ? "우선 지원 · 온보딩 30분" : "우선 이메일 지원"}
          </p>
          <p className="text-sm text-muted-foreground">
            {tier === "team"
              ? "Team 플랜 전용 지원 채널을 이용할 수 있습니다."
              : "영업일 기준 1일 내 회신을 목표로 지원합니다."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={supportMailto}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            이메일 문의
          </a>
          {tier === "team" &&
            (teamOnboardingUrl ? (
              <Link
                href={teamOnboardingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                온보딩 예약
              </Link>
            ) : (
              <a
                href={onboardingMailto}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                온보딩 예약
              </a>
            ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Headphones className="size-4" />
          {tier === "team" ? "우선 지원 및 온보딩" : "우선 이메일 지원"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {tier === "pro" ? (
          <>
            <p className="leading-relaxed text-muted-foreground">
              Pro 플랜(또는 무료 체험) 고객은 이메일 문의 시{" "}
              <span className="font-medium text-foreground">
                영업일 기준 1일 내
              </span>{" "}
              회신을 목표로 우선 지원합니다.
            </p>
            <a
              href={supportMailto}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex items-center gap-2",
              )}
            >
              <Mail className="size-4" />
              {priorityEmail}
            </a>
          </>
        ) : (
          <>
            <p className="leading-relaxed text-muted-foreground">
              Team 플랜에는 우선 이메일 지원과{" "}
              <span className="font-medium text-foreground">
                30분 온보딩 세션
              </span>
              이 포함되어 있습니다. 사무소 설정·템플릿·팀 활용 방법을 안내해
              드립니다.
            </p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>우선 지원: 영업일 기준 1일 내 회신 목표</li>
              <li>온보딩: 초기 설정·워크플로 점검 (약 30분)</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <a
                href={supportMailto}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "inline-flex items-center gap-2",
                )}
              >
                <Mail className="size-4" />
                우선 지원 문의
              </a>
              {teamOnboardingUrl ? (
                <Link
                  href={teamOnboardingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "inline-flex items-center gap-2",
                  )}
                >
                  <CalendarClock className="size-4" />
                  온보딩 30분 예약
                </Link>
              ) : (
                <a
                  href={onboardingMailto}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "inline-flex items-center gap-2",
                  )}
                >
                  <CalendarClock className="size-4" />
                  온보딩 예약 문의
                </a>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
