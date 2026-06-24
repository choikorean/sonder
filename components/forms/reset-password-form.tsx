"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage, translateAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<
    "loading" | "ready" | "missing"
  >("loading");

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSessionState(user ? "ready" : "missing");
    }

    void checkSession();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(translateAuthError(getAuthErrorMessage(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">새 비밀번호 설정</CardTitle>
        <CardDescription>
          새 비밀번호를 입력한 뒤 저장하면 로그인됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessionState === "loading" && (
          <p className="text-sm text-muted-foreground">확인 중...</p>
        )}
        {sessionState === "missing" && (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              비밀번호 재설정 링크를 통해 접속해 주세요. 링크가 만료되었다면
              다시 요청할 수 있습니다.
            </p>
            <Link
              href="/login"
              className="inline-block font-medium text-foreground underline-offset-4 hover:underline"
            >
              로그인 화면에서 재설정 요청하기
            </Link>
          </div>
        )}
        {sessionState === "ready" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">새 비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "저장 중..." : "비밀번호 저장"}
          </Button>
        </form>
        )}

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
