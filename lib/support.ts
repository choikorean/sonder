import "server-only";

import { DEFAULT_SUPPORT_EMAIL } from "@/lib/constants";
import type { PlanId } from "@/lib/plans";

export type SupportTier = "none" | "pro" | "team";

export type SupportConfig = {
  generalEmail: string;
  priorityEmail: string;
  teamOnboardingUrl: string | null;
};

export function getSupportConfig(): SupportConfig {
  const general = process.env.SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL;
  const priority =
    process.env.PRIORITY_SUPPORT_EMAIL?.trim() || general;
  const teamOnboardingUrl = process.env.TEAM_ONBOARDING_URL?.trim() || null;

  return {
    generalEmail: general,
    priorityEmail: priority,
    teamOnboardingUrl,
  };
}

/** Pro: 우선 이메일 / Team(유료): 우선 지원 + 온보딩 / 체험: Pro 수준 지원 */
export function getSupportTier(input: {
  prioritySupport: boolean;
  planId: PlanId;
  isTrialing: boolean;
}): SupportTier {
  if (!input.prioritySupport) return "none";
  if (input.planId === "team" && !input.isTrialing) return "team";
  return "pro";
}

export function buildPrioritySupportMailto(
  email: string,
  subject = "[TaxFlo] 우선 지원 문의",
) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

export function buildOnboardingMailto(email: string) {
  return buildPrioritySupportMailto(email, "[TaxFlo] Team 온보딩 예약");
}
