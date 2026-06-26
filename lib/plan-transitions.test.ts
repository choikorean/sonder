import { describe, expect, it } from "vitest";

import { canManageBilling } from "@/lib/billing/access";
import {
  ClientGenerationError,
  getClientLimit,
  resolveClientForGeneration,
  resolveClientScope,
} from "@/lib/clients";
import { toConsultationApiResponse } from "@/lib/consultation-output";
import { retentionCutoffIso } from "@/lib/copy-formats";
import { canAccessTeamFeatures } from "@/lib/org";
import { CLIENT_LIMITS, FREE_TRIAL, PLANS } from "@/lib/plans";
import { mapSubscriptionRow } from "@/lib/subscription";
import {
  activeRow,
  buildSubscriberSnapshot,
  capabilityFlags,
  expiredRow,
  trialingRow,
} from "@/lib/test/plan-transition-helpers";
import type { OrganizationContext } from "@/lib/org";

const SAMPLE_CONSULTATION = {
  summary: "내부 요약",
  clientSummary: "고객 전달용",
  requiredDocuments: "부가세 신고서",
  nextActions: "자료 수집",
  nextGuidance: "다음 주 연락",
};

const DB_CLIENT_ROW = {
  id: "client-1",
  name: "테스트 거래처",
  contact_name: null,
  business_type: null,
  phone: null,
  email: null,
  memo: null,
  is_active: true,
  organization_id: null as string | null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function orgContext(role: OrganizationContext["role"]): OrganizationContext {
  return {
    id: "org-1",
    name: "테스트 사무소",
    ownerUserId: "owner-1",
    seatLimit: 5,
    role,
    members: [],
    memberUserIds: [],
    activeMemberCount: 2,
    canManageMembers: role === "owner" || role === "admin",
  };
}

function mockSupabaseWithClient(row: typeof DB_CLIENT_ROW | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: row, error: null }),
        }),
      }),
    }),
  };
}

describe("요금제 전환: capability 잠금/해제", () => {
  it("Starter → Pro 업그레이드 시 Pro 기능이 해제된다", () => {
    const starter = buildSubscriberSnapshot(activeRow("starter"));
    const pro = buildSubscriberSnapshot(activeRow("pro"));

    expect(capabilityFlags(starter.capabilities)).toEqual({
      clients: false,
      phrases: false,
      fullConsultation: false,
      officeSignature: false,
      officePhrases: false,
      reviewSummary: false,
    });
    expect(capabilityFlags(pro.capabilities)).toEqual({
      clients: true,
      phrases: true,
      fullConsultation: true,
      officeSignature: true,
      officePhrases: false,
      reviewSummary: false,
    });
    expect(pro.monthlyLimit).toBe(PLANS.pro.monthlyLimit);
    expect(pro.retentionDays).toBe(PLANS.pro.retentionDays);
  });

  it("Pro → Starter 다운그레이드 시 Pro 전용 기능이 잠긴다", () => {
    const pro = buildSubscriberSnapshot(activeRow("pro"));
    const starter = buildSubscriberSnapshot(activeRow("starter"));

    expect(capabilityFlags(pro.capabilities).clients).toBe(true);
    expect(capabilityFlags(starter.capabilities).clients).toBe(false);
    expect(starter.monthlyLimit).toBe(PLANS.starter.monthlyLimit);
    expect(starter.retentionDays).toBe(PLANS.starter.retentionDays);
  });

  it("Pro → Starter → Pro 재업그레이드 시 기능이 다시 해제된다", () => {
    const proAgain = buildSubscriberSnapshot(activeRow("pro"));
    const starter = buildSubscriberSnapshot(activeRow("starter"));

    expect(capabilityFlags(starter.capabilities).phrases).toBe(false);
    expect(capabilityFlags(proAgain.capabilities).phrases).toBe(true);
    expect(capabilityFlags(proAgain.capabilities)).toEqual(
      capabilityFlags(buildSubscriberSnapshot(activeRow("pro")).capabilities),
    );
  });

  it("Pro → Team 업그레이드 시 Team 전용 기능이 추가된다", () => {
    const pro = buildSubscriberSnapshot(activeRow("pro"));
    const team = buildSubscriberSnapshot(activeRow("team"));

    expect(capabilityFlags(pro.capabilities).officePhrases).toBe(false);
    expect(capabilityFlags(pro.capabilities).reviewSummary).toBe(false);
    expect(capabilityFlags(team.capabilities).officePhrases).toBe(true);
    expect(capabilityFlags(team.capabilities).reviewSummary).toBe(true);
    expect(team.monthlyLimit).toBe(PLANS.team.monthlyLimit);
  });

  it("Team → Pro 다운그레이드 시 Team 전용 기능만 잠긴다", () => {
    const team = buildSubscriberSnapshot(activeRow("team"));
    const pro = buildSubscriberSnapshot(activeRow("pro"));

    expect(capabilityFlags(team.capabilities).clients).toBe(true);
    expect(capabilityFlags(pro.capabilities).clients).toBe(true);
    expect(capabilityFlags(pro.capabilities).officePhrases).toBe(false);
    expect(capabilityFlags(pro.capabilities).reviewSummary).toBe(false);
  });

  it("무료 체험 중에는 Pro+Team 기능을 모두 쓰되 한도·보관만 제한한다", () => {
    const trial = buildSubscriberSnapshot(trialingRow("free"));

    expect(capabilityFlags(trial.capabilities).officePhrases).toBe(true);
    expect(capabilityFlags(trial.capabilities).reviewSummary).toBe(true);
    expect(trial.monthlyLimit).toBe(FREE_TRIAL.generationLimit);
    expect(trial.retentionDays).toBe(FREE_TRIAL.retentionDays);
  });

  it("체험 종료 후 Starter 결제 시 체험 전용 기능이 잠긴다", () => {
    const trial = buildSubscriberSnapshot(trialingRow("free"));
    const starter = buildSubscriberSnapshot(activeRow("starter"));

    expect(capabilityFlags(trial.capabilities).clients).toBe(true);
    expect(capabilityFlags(starter.capabilities).clients).toBe(false);
  });

  it("구독 기간 만료 시 effectivePlanId가 free(Starter 수준)로 떨어진다", () => {
    const expired = buildSubscriberSnapshot(expiredRow("pro"));

    expect(expired.subscription.planId).toBe("pro");
    expect(expired.subscription.effectivePlanId).toBe("free");
    expect(expired.subscription.isActive).toBe(false);
    expect(capabilityFlags(expired.capabilities).clients).toBe(false);
  });

  it("해지 예약 중(cancel_at_period_end)에도 기간 내 capability는 유지된다", () => {
    const canceling = buildSubscriberSnapshot({
      plan: "pro",
      status: "active",
      current_period_end: new Date(Date.now() + 86400000 * 10).toISOString(),
      cancel_at_period_end: true,
    });

    expect(canceling.subscription.cancelAtPeriodEnd).toBe(true);
    expect(canceling.subscription.isActive).toBe(true);
    expect(capabilityFlags(canceling.capabilities).clients).toBe(true);
  });
});

describe("요금제 전환: Starter ↔ Team, 체험 → Pro/Team", () => {
  it("Starter → Team 업그레이드 시 Pro·Team 기능이 모두 해제된다", () => {
    const starter = buildSubscriberSnapshot(activeRow("starter"));
    const team = buildSubscriberSnapshot(activeRow("team"));

    expect(capabilityFlags(starter.capabilities)).toEqual({
      clients: false,
      phrases: false,
      fullConsultation: false,
      officeSignature: false,
      officePhrases: false,
      reviewSummary: false,
    });
    expect(capabilityFlags(team.capabilities)).toEqual({
      clients: true,
      phrases: true,
      fullConsultation: true,
      officeSignature: true,
      officePhrases: true,
      reviewSummary: true,
    });
    expect(team.monthlyLimit).toBe(PLANS.team.monthlyLimit);
    expect(team.retentionDays).toBe(PLANS.team.retentionDays);
    expect(
      getClientLimit({ capabilities: team.capabilities, subscription: team.subscription }),
    ).toBe(CLIENT_LIMITS.team);
    expect(
      canAccessTeamFeatures(orgContext("owner"), team.subscription.effectivePlanId, true),
    ).toBe(true);
  });

  it("Starter → Team 업그레이드 시 사무소 고객 스코프가 활성화된다", () => {
    const team = buildSubscriberSnapshot(activeRow("team"));
    const scope = resolveClientScope({
      subscription: team.subscription,
      organizationId: "org-1",
    });

    expect(scope.isTeamScope).toBe(true);
    expect(scope.organizationId).toBe("org-1");
    expect(scope.requiresOrganization).toBe(true);
  });

  it("Team → Starter 다운그레이드 시 Pro·Team 기능이 모두 잠긴다", () => {
    const team = buildSubscriberSnapshot(activeRow("team"));
    const starter = buildSubscriberSnapshot(activeRow("starter"));

    expect(capabilityFlags(team.capabilities).officePhrases).toBe(true);
    expect(capabilityFlags(team.capabilities).reviewSummary).toBe(true);
    expect(capabilityFlags(starter.capabilities)).toEqual({
      clients: false,
      phrases: false,
      fullConsultation: false,
      officeSignature: false,
      officePhrases: false,
      reviewSummary: false,
    });
    expect(starter.monthlyLimit).toBe(PLANS.starter.monthlyLimit);
    expect(starter.retentionDays).toBe(PLANS.starter.retentionDays);
    expect(
      getClientLimit({ capabilities: starter.capabilities, subscription: starter.subscription }),
    ).toBe(0);
    expect(
      canAccessTeamFeatures(orgContext("owner"), starter.subscription.effectivePlanId, true),
    ).toBe(false);
  });

  it("Team → Starter 다운그레이드 시 사무소 스코프가 비활성화된다", () => {
    const team = buildSubscriberSnapshot(activeRow("team"));
    const starter = buildSubscriberSnapshot(activeRow("starter"));

    const teamScope = resolveClientScope({
      subscription: team.subscription,
      organizationId: "org-1",
    });
    const starterScope = resolveClientScope({
      subscription: starter.subscription,
      organizationId: "org-1",
    });

    expect(teamScope.isTeamScope).toBe(true);
    expect(starterScope.isTeamScope).toBe(false);
    expect(starterScope.organizationId).toBe(null);
  });

  it("Team → Starter → Team 재업그레이드 시 Team 기능과 한도가 복구된다", () => {
    const starter = buildSubscriberSnapshot(activeRow("starter"));
    const teamAgain = buildSubscriberSnapshot(activeRow("team"));

    expect(capabilityFlags(starter.capabilities).clients).toBe(false);
    expect(capabilityFlags(teamAgain.capabilities).clients).toBe(true);
    expect(capabilityFlags(teamAgain.capabilities).officePhrases).toBe(true);
    expect(
      getClientLimit({
        capabilities: teamAgain.capabilities,
        subscription: teamAgain.subscription,
      }),
    ).toBe(CLIENT_LIMITS.team);
  });

  it("무료 체험 → Pro 결제 시 Pro 기능은 유지되고 Team 전용 기능만 잠긴다", () => {
    const trial = buildSubscriberSnapshot(trialingRow("free"));
    const pro = buildSubscriberSnapshot(activeRow("pro"));

    expect(trial.subscription.isTrialing).toBe(true);
    expect(pro.subscription.isTrialing).toBe(false);
    expect(capabilityFlags(trial.capabilities).clients).toBe(true);
    expect(capabilityFlags(trial.capabilities).officePhrases).toBe(true);
    expect(capabilityFlags(trial.capabilities).reviewSummary).toBe(true);
    expect(capabilityFlags(pro.capabilities)).toEqual({
      clients: true,
      phrases: true,
      fullConsultation: true,
      officeSignature: true,
      officePhrases: false,
      reviewSummary: false,
    });
    expect(trial.monthlyLimit).toBe(FREE_TRIAL.generationLimit);
    expect(pro.monthlyLimit).toBe(PLANS.pro.monthlyLimit);
    expect(trial.retentionDays).toBe(FREE_TRIAL.retentionDays);
    expect(pro.retentionDays).toBe(PLANS.pro.retentionDays);
    expect(
      getClientLimit({ capabilities: trial.capabilities, subscription: trial.subscription }),
    ).toBe(CLIENT_LIMITS.pro);
    expect(
      getClientLimit({ capabilities: pro.capabilities, subscription: pro.subscription }),
    ).toBe(CLIENT_LIMITS.pro);
  });

  it("무료 체험 → Team 결제 시 Team 기능과 한도가 적용된다", () => {
    const trial = buildSubscriberSnapshot(trialingRow("free"));
    const team = buildSubscriberSnapshot(activeRow("team"));

    expect(capabilityFlags(trial.capabilities).officePhrases).toBe(true);
    expect(capabilityFlags(team.capabilities).officePhrases).toBe(true);
    expect(capabilityFlags(team.capabilities).reviewSummary).toBe(true);
    expect(trial.monthlyLimit).toBe(FREE_TRIAL.generationLimit);
    expect(team.monthlyLimit).toBe(PLANS.team.monthlyLimit);
    expect(trial.retentionDays).toBe(FREE_TRIAL.retentionDays);
    expect(team.retentionDays).toBe(PLANS.team.retentionDays);
    expect(
      getClientLimit({ capabilities: trial.capabilities, subscription: trial.subscription }),
    ).toBe(CLIENT_LIMITS.pro);
    expect(
      getClientLimit({ capabilities: team.capabilities, subscription: team.subscription }),
    ).toBe(CLIENT_LIMITS.team);
    expect(
      canAccessTeamFeatures(orgContext("owner"), team.subscription.effectivePlanId, true),
    ).toBe(true);
  });

  it("체험 → Pro/Team 후 상담·고객 데이터 접근 패턴이 유지된다", async () => {
    const trial = buildSubscriberSnapshot(trialingRow("free"));
    const pro = buildSubscriberSnapshot(activeRow("pro"));
    const team = buildSubscriberSnapshot(activeRow("team"));

    const trialView = toConsultationApiResponse(SAMPLE_CONSULTATION, true);
    const proView = toConsultationApiResponse(
      SAMPLE_CONSULTATION,
      pro.capabilities.fullConsultationOutput,
    );
    const teamView = toConsultationApiResponse(
      SAMPLE_CONSULTATION,
      team.capabilities.fullConsultationOutput,
    );

    expect(trialView.clientSummary).toBe(SAMPLE_CONSULTATION.clientSummary);
    expect(proView.clientSummary).toBe(SAMPLE_CONSULTATION.clientSummary);
    expect(teamView.clientSummary).toBe(SAMPLE_CONSULTATION.clientSummary);

    await expect(
      resolveClientForGeneration(mockSupabaseWithClient(DB_CLIENT_ROW) as never, {
        capabilities: trial.capabilities,
        subscription: trial.subscription,
        organizationId: null,
        clientId: DB_CLIENT_ROW.id,
      }),
    ).resolves.toMatchObject({ clientId: DB_CLIENT_ROW.id });

    await expect(
      resolveClientForGeneration(mockSupabaseWithClient(DB_CLIENT_ROW) as never, {
        capabilities: pro.capabilities,
        subscription: pro.subscription,
        organizationId: null,
        clientId: DB_CLIENT_ROW.id,
      }),
    ).resolves.toMatchObject({ clientId: DB_CLIENT_ROW.id });
  });

  it("Team → Starter 다운그레이드 후 같은 고객은 잠기고 Team 재업그레이드 시 사무소 스코프에서 다시 사용 가능하다", async () => {
    const starter = buildSubscriberSnapshot(activeRow("starter"));
    const orgClient = { ...DB_CLIENT_ROW, organization_id: "org-1" };
    const teamAgain = buildSubscriberSnapshot(activeRow("team"));

    await expect(
      resolveClientForGeneration(mockSupabaseWithClient(orgClient) as never, {
        capabilities: starter.capabilities,
        subscription: starter.subscription,
        organizationId: "org-1",
        clientId: orgClient.id,
      }),
    ).rejects.toMatchObject({ status: 403 });

    await expect(
      resolveClientForGeneration(mockSupabaseWithClient(orgClient) as never, {
        capabilities: teamAgain.capabilities,
        subscription: teamAgain.subscription,
        organizationId: "org-1",
        clientId: orgClient.id,
      }),
    ).resolves.toMatchObject({ clientId: orgClient.id });
  });
});

describe("요금제 전환: 데이터 보존 (삭제 없이 접근만 제어)", () => {
  it("Starter 다운그레이드 시 상담 API 응답만 마스킹하고 DB 필드 구조는 유지 가능하다", () => {
    const masked = toConsultationApiResponse(SAMPLE_CONSULTATION, false);
    expect(masked.summary).toBe(SAMPLE_CONSULTATION.summary);
    expect(masked.clientSummary).toBe("");
    expect(masked.requiredDocuments).toBe("");
    expect(masked.fullConsultationOutput).toBe(false);

    const restored = toConsultationApiResponse(SAMPLE_CONSULTATION, true);
    expect(restored).toEqual({
      ...SAMPLE_CONSULTATION,
      fullConsultationOutput: true,
    });
  });

  it("Pro → Starter → Pro 재업그레이드 시 동일 상담 데이터가 다시 노출된다", () => {
    const proView = toConsultationApiResponse(SAMPLE_CONSULTATION, true);
    const starterView = toConsultationApiResponse(SAMPLE_CONSULTATION, false);
    const proAgain = toConsultationApiResponse(SAMPLE_CONSULTATION, true);

    expect(starterView.clientSummary).toBe("");
    expect(proAgain.clientSummary).toBe(proView.clientSummary);
  });

  it("이력 보관 기간은 플랜에 따라 달라지며 오래된 데이터는 조회에서만 제외된다", () => {
    const starterCutoff = retentionCutoffIso(PLANS.starter.retentionDays);
    const proCutoff = retentionCutoffIso(PLANS.pro.retentionDays);

    expect(starterCutoff).not.toBeNull();
    expect(proCutoff).not.toBeNull();
    expect(new Date(proCutoff!).getTime()).toBeLessThan(
      new Date(starterCutoff!).getTime(),
    );

    const oldRecord = "2020-01-01T00:00:00.000Z";
    const recentRecord = new Date().toISOString();

    expect(new Date(oldRecord) < new Date(starterCutoff!)).toBe(true);
    expect(new Date(recentRecord) >= new Date(starterCutoff!)).toBe(true);
  });

  it("고객 한도는 다운그레이드 시 0, 재업그레이드 시 복구된다", () => {
    const pro = buildSubscriberSnapshot(activeRow("pro"));
    const starter = buildSubscriberSnapshot(activeRow("starter"));
    const proAgain = buildSubscriberSnapshot(activeRow("pro"));

    expect(getClientLimit({ capabilities: pro.capabilities, subscription: pro.subscription })).toBe(
      CLIENT_LIMITS.pro,
    );
    expect(
      getClientLimit({ capabilities: starter.capabilities, subscription: starter.subscription }),
    ).toBe(0);
    expect(
      getClientLimit({ capabilities: proAgain.capabilities, subscription: proAgain.subscription }),
    ).toBe(CLIENT_LIMITS.pro);
  });

  it("Starter에서는 clientId 연결이 차단되고 Pro 복귀 시 같은 고객을 다시 쓸 수 있다", async () => {
    const pro = buildSubscriberSnapshot(activeRow("pro"));
    const starter = buildSubscriberSnapshot(activeRow("starter"));

    await expect(
      resolveClientForGeneration(mockSupabaseWithClient(DB_CLIENT_ROW) as never, {
        capabilities: starter.capabilities,
        subscription: starter.subscription,
        organizationId: null,
        clientId: DB_CLIENT_ROW.id,
      }),
    ).rejects.toBeInstanceOf(ClientGenerationError);

    const resolved = await resolveClientForGeneration(
      mockSupabaseWithClient(DB_CLIENT_ROW) as never,
      {
        capabilities: pro.capabilities,
        subscription: pro.subscription,
        organizationId: null,
        clientId: DB_CLIENT_ROW.id,
      },
    );

    expect(resolved.clientId).toBe(DB_CLIENT_ROW.id);
    expect(resolved.client?.name).toBe(DB_CLIENT_ROW.name);
  });
});

describe("요금제 전환: Team 스코프", () => {
  it("Team → Pro 다운그레이드 시 사무소 고객 스코프가 개인 스코프로 전환된다", () => {
    const team = buildSubscriberSnapshot(activeRow("team"));
    const pro = buildSubscriberSnapshot(activeRow("pro"));

    const teamScope = resolveClientScope({
      subscription: team.subscription,
      organizationId: "org-1",
    });
    const proScope = resolveClientScope({
      subscription: pro.subscription,
      organizationId: "org-1",
    });

    expect(teamScope.isTeamScope).toBe(true);
    expect(teamScope.organizationId).toBe("org-1");
    expect(proScope.isTeamScope).toBe(false);
    expect(proScope.organizationId).toBe(null);
  });

  it("Team → Pro 시 사무소 소속 고객은 개인 스코프에서 조회되지 않는다", async () => {
    const pro = buildSubscriberSnapshot(activeRow("pro"));
    const orgClient = { ...DB_CLIENT_ROW, organization_id: "org-1" };

    await expect(
      resolveClientForGeneration(mockSupabaseWithClient(orgClient) as never, {
        capabilities: pro.capabilities,
        subscription: pro.subscription,
        organizationId: "org-1",
        clientId: orgClient.id,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("Team → Pro → Team 재업그레이드 시 사무소 스코프가 복구된다", () => {
    const teamAgain = buildSubscriberSnapshot(activeRow("team"));
    const scope = resolveClientScope({
      subscription: teamAgain.subscription,
      organizationId: "org-1",
    });

    expect(scope.isTeamScope).toBe(true);
    expect(getClientLimit({
      capabilities: teamAgain.capabilities,
      subscription: teamAgain.subscription,
    })).toBe(CLIENT_LIMITS.team);
  });

  it("Team 기능(팀 관리·검토)은 Team 플랜에서만 열린다", () => {
    const pro = buildSubscriberSnapshot(activeRow("pro"));
    const team = buildSubscriberSnapshot(activeRow("team"));

    expect(
      canAccessTeamFeatures(orgContext("owner"), pro.subscription.effectivePlanId, true),
    ).toBe(false);
    expect(
      canAccessTeamFeatures(orgContext("member"), team.subscription.effectivePlanId, true),
    ).toBe(true);
    expect(canManageBilling(orgContext("member"))).toBe(false);
    expect(canManageBilling(orgContext("owner"))).toBe(true);
  });
});

describe("요금제 전환: 구독 레코드 매핑", () => {
  it("플랜 ID는 레코드에 보존되고 effectivePlanId만 만료 시 free로 바뀐다", () => {
    const active = mapSubscriptionRow({
      plan: "team",
      status: "active",
      billing_cycle: "monthly",
      started_at: null,
      current_period_start: null,
      current_period_end: new Date(Date.now() + 86400000).toISOString(),
      trial_ends_at: null,
      next_billing_at: null,
      cancel_at_period_end: false,
      canceled_at: null,
    });

    const expired = mapSubscriptionRow({
      plan: "team",
      status: "active",
      billing_cycle: "monthly",
      started_at: null,
      current_period_start: null,
      current_period_end: new Date(Date.now() - 86400000).toISOString(),
      trial_ends_at: null,
      next_billing_at: null,
      cancel_at_period_end: false,
      canceled_at: null,
    });

    expect(active.planId).toBe("team");
    expect(active.effectivePlanId).toBe("team");
    expect(expired.planId).toBe("team");
    expect(expired.effectivePlanId).toBe("free");
  });
});
