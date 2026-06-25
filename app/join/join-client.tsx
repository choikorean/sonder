"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { LoadingButton } from "@/components/loading-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PreviewResult =
  | {
      success: true;
      data: {
        organizationName: string;
        expiresAt: string;
        invitedEmail: string | null;
      };
    }
  | { success: false; error: string };

type AcceptResult =
  | { success: true; data: { organizationId: string } }
  | { success: false; error: string };

export default function JoinOrganizationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function loadPreview() {
      if (!token) {
        setError("초대 링크가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/org/invites/preview?token=${encodeURIComponent(token)}`,
        );
        const json: PreviewResult = await res.json();
        if (!json.success) {
          setError(json.error);
          return;
        }
        setOrganizationName(json.data.organizationName);
      } catch {
        setError("초대 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    void loadPreview();
  }, [token]);

  async function handleJoin() {
    setJoining(true);
    setError(null);

    try {
      const res = await fetch("/api/org/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json: AcceptResult = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("사무소 가입 중 오류가 발생했습니다.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight">사무소 초대</h1>
        <p className="text-sm text-muted-foreground">
          팀 초대 링크를 통해 사무소에 합류합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">초대 확인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          ) : done ? (
            <div className="space-y-4">
              <p className="text-sm">
                <span className="font-medium">{organizationName}</span> 사무소에
                가입되었습니다. 이제 사무소의 생성 이력을 함께 확인할 수
                있습니다.
              </p>
              <Link
                href="/dashboard"
                className="text-sm font-medium underline underline-offset-4"
              >
                대시보드로 이동
              </Link>
            </div>
          ) : error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">
                <span className="font-medium">{organizationName}</span> 사무소의
                TaxFlo 팀에 초대되었습니다. 가입하면 사무소 구성원의 생성
                이력을 함께 볼 수 있습니다.
              </p>
              <LoadingButton onClick={handleJoin} loading={joining} size="lg">
                {joining ? "가입 중..." : "초대 수락하기"}
              </LoadingButton>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
