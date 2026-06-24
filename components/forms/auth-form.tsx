"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import {
  AUTH_CALLBACK_ERROR_MESSAGE,
  getAuthErrorMessage,
  translateAuthError,
} from "@/lib/auth-errors";
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

type Mode = "login" | "signup" | "reset-request";

function getPasswordResetRedirectUrl() {
  return `${window.location.origin}/auth/callback?next=/login/reset-password`;
}

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("error") === "auth_callback") {
      setError(AUTH_CALLBACK_ERROR_MESSAGE);
    }
  }, [searchParams]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    try {
      if (mode === "reset-request") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          { redirectTo: getPasswordResetRedirectUrl() },
        );
        if (resetError) throw resetError;

        setMessage(
          "비밀번호 재설정 링크를 이메일로 보냈습니다. 메일함을 확인해 주세요.",
        );
        return;
      }

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });
        if (signUpError) throw signUpError;

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setMessage(
            "확인 이메일을 보냈습니다. 메일함에서 인증을 완료한 뒤 로그인해 주세요.",
          );
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(translateAuthError(getAuthErrorMessage(err)));
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "login"
      ? "로그인"
      : mode === "signup"
        ? "회원가입"
        : "비밀번호 재설정";

  const description =
    mode === "login"
      ? "TaxFlo 계정으로 로그인하세요."
      : mode === "signup"
        ? "세무사 업무 자동화를 지금 시작하세요."
        : "가입한 이메일을 입력하시면 재설정 링크를 보내드립니다.";

  const submitLabel =
    mode === "login"
      ? "로그인"
      : mode === "signup"
        ? "회원가입"
        : "재설정 링크 보내기";

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>

          {mode !== "reset-request" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">비밀번호</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("reset-request")}
                    className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={6}
                required
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-muted-foreground" role="status">
              {message}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "처리 중..." : submitLabel}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "login" && (
            <>
              아직 계정이 없으신가요?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                회원가입
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              이미 계정이 있으신가요?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                로그인
              </button>
            </>
          )}
          {mode === "reset-request" && (
            <>
              비밀번호가 기억나셨나요?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                로그인
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
