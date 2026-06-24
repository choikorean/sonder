"use client";

import { useEffect, useState } from "react";
import { Copy, Users } from "lucide-react";

import { LoadingButton } from "@/components/loading-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OrganizationContext, OrgMember } from "@/lib/org";

type OrgData = OrganizationContext;

type OrgApiResult =
  | {
      success: true;
      data: {
        organization: OrgData | null;
        canManageTeam: boolean;
        seatLimit: number;
      };
    }
  | { success: false; error: string };

type InviteApiResult =
  | {
      success: true;
      data: {
        inviteUrl: string;
        expiresAt: string;
        seatsUsed: number;
        seatLimit: number;
      };
    }
  | { success: false; error: string };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function roleLabel(role: OrgMember["role"]) {
  if (role === "owner") return "소유자";
  if (role === "admin") return "관리자";
  return "팀원";
}

export function TeamSettingsForm() {
  const [organization, setOrganization] = useState<OrgData | null>(null);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadOrg() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/org");
      const json: OrgApiResult = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }
      setOrganization(json.data.organization);
      setCanManageTeam(json.data.canManageTeam);
    } catch {
      setError("팀 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrg();
  }, []);

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization?.canManageMembers) return;

    setInviteLoading(true);
    setError(null);
    setNotice(null);
    setInviteUrl(null);

    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim() || undefined,
        }),
      });
      const json: InviteApiResult = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }
      setInviteUrl(json.data.inviteUrl);
      setInviteExpiresAt(json.data.expiresAt);
      setNotice("초대 링크가 생성되었습니다. 팀원에게 공유해 주세요.");
      setInviteEmail("");
      void loadOrg();
    } catch {
      setError("초대 링크 생성 중 오류가 발생했습니다.");
    } finally {
      setInviteLoading(false);
    }
  }

  async function copyInviteUrl() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setNotice("초대 링크를 복사했습니다.");
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (!canManageTeam) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>팀 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Team 요금제를 구독하면 최대 5인까지 팀원을 초대하고 생성 이력을
            공유할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-destructive">
            사무소 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  const seatsRemaining = Math.max(
    0,
    organization.seatLimit - organization.activeMemberCount,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            {organization.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            좌석 {organization.activeMemberCount} / {organization.seatLimit} 사용
            중
            {seatsRemaining > 0
              ? ` · 초대 가능 ${seatsRemaining}명`
              : " · 좌석이 모두 사용 중입니다"}
          </p>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">이름</th>
                  <th className="px-3 py-2 font-medium">역할</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody>
                {organization.members.map((member) => (
                  <tr key={member.userId} className="border-t border-border">
                    <td className="px-3 py-2">
                      <div className="font-medium">{member.name}</div>
                      {member.email && (
                        <div className="text-xs text-muted-foreground">
                          {member.email}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">{roleLabel(member.role)}</td>
                    <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                      {formatDate(member.joinedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {organization.canManageMembers && seatsRemaining > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">팀원 초대</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                초대 링크는 7일간 유효합니다. 팀원이 TaxFlo에 로그인한 뒤 링크를
                열어 가입하면 사무소 생성 이력을 함께 볼 수 있습니다.
              </p>

              <div className="space-y-2">
                <Label htmlFor="inviteEmail">초대할 이메일 (선택)</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="예) teammate@example.com"
                  disabled={inviteLoading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              {notice && (
                <p className="text-sm text-foreground">{notice}</p>
              )}

              <LoadingButton type="submit" loading={inviteLoading}>
                {inviteLoading ? "생성 중..." : "초대 링크 생성"}
              </LoadingButton>

              {inviteUrl && (
                <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    초대 링크
                    {inviteExpiresAt
                      ? ` · ${formatDate(inviteExpiresAt)}까지 유효`
                      : ""}
                  </p>
                  <p className="break-all text-sm">{inviteUrl}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyInviteUrl}
                  >
                    <Copy className="size-4" />
                    링크 복사
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
