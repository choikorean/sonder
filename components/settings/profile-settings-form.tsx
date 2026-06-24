"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LoadingButton } from "@/components/loading-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProfileData = {
  officeName: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
};

type ApiResult =
  | { success: true; data: ProfileData }
  | { success: false; error: string };

export function ProfileSettingsForm({ canEdit }: { canEdit: boolean }) {
  const [officeName, setOfficeName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/profile");
        const json: ApiResult = await res.json();
        if (json.success) {
          setOfficeName(json.data.officeName ?? "");
          setContactName(json.data.contactName ?? "");
          setPhone(json.data.phone ?? "");
          setEmail(json.data.email ?? "");
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officeName: officeName.trim() || null,
          name: contactName.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      const json: ApiResult = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }
      setNotice("프로필이 저장되었습니다.");
    } catch {
      setError("프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>사무소 프로필</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {canEdit ? (
              <p className="text-sm text-muted-foreground">
                입력한 사무소명·담당자명·연락처는 자료 요청문·신고 결과 설명문 생성 시
                자동으로 반영됩니다.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                사무소 프로필 편집 및 생성문 자동 삽입은{" "}
                <Link
                  href="/settings/billing"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Pro 플랜
                </Link>
                에서 이용할 수 있습니다. 아래 정보는 참고용으로만 표시됩니다.
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="officeName">사무소명</Label>
                <Input
                  id="officeName"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  placeholder="예) ○○세무회계"
                  disabled={saving || !canEdit}
                  readOnly={!canEdit}
                  className={!canEdit ? "bg-muted" : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">담당자명</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="예) 홍길동 세무사"
                  disabled={saving || !canEdit}
                  readOnly={!canEdit}
                  className={!canEdit ? "bg-muted" : undefined}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="예) 02-1234-5678"
                  disabled={saving || !canEdit}
                  readOnly={!canEdit}
                  className={!canEdit ? "bg-muted" : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  value={email}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="text-sm text-foreground">{notice}</p>
            )}

            {canEdit && (
              <LoadingButton type="submit" loading={saving}>
                {saving ? "저장 중..." : "저장하기"}
              </LoadingButton>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
