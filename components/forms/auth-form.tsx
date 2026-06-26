"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import {
  AUTH_CALLBACK_ERROR_MESSAGE,
  getAuthErrorMessage,
  translateAuthError,
} from "@/lib/auth-errors";
import { ACCOUNT_DATA_RETENTION_DAYS } from "@/lib/account/withdraw";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Mode = "login" | "signup" | "reset-request";

type InviteAcceptResult =
  | { success: true; data: { organizationId: string } }
  | { success: false; error: string };

type WithdrawnStatusResult =
  | { success: true; data: { canReactivate: boolean; retentionExpired: boolean } }
  | { success: false; error: string };

type ReactivateResult =
  | { success: true; data: { userId: string; message: string } }
  | { success: false; error: string };

const REACTIVATE_LOGIN_MESSAGE =
  "탈퇴한 계정입니다. 동일 이메일로 회원가입하면 이름과 비밀번호를 새로 설정해 계정을 복구할 수 있습니다.";

const REACTIVATE_SIGNUP_DESCRIPTION =
  "탈퇴한 계정을 동일 이메일로 복구합니다. 이름과 비밀번호를 새로 설정해 주세요.";

async function fetchWithdrawnStatus(email: string): Promise<WithdrawnStatusResult> {
  const res = await fetch("/api/account/withdrawn-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

async function reactivateAccount(input: {
  email: string;
  password: string;
  name: string;
}): Promise<ReactivateResult> {
  const res = await fetch("/api/account/reactivate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

function getWithdrawnSignupMessage(retentionExpired: boolean) {
  if (retentionExpired) {
    return `데이터 보관 기간(${ACCOUNT_DATA_RETENTION_DAYS}일)이 지나 동일 이메일로 계정을 복구할 수 없습니다.`;
  }
  return "이미 가입된 이메일입니다. 탈퇴한 계정이라면 아래에서 이름과 비밀번호를 새로 설정해 복구할 수 있습니다.";
}

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

function getPasswordResetRedirectUrl() {
  return `${window.location.origin}/auth/callback?next=/login/reset-password`;
}

async function acceptInvite(token: string): Promise<InviteAcceptResult> {
  const res = await fetch("/api/org/invites/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return res.json();
}

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const nextPath = inviteToken
    ? `/join?token=${encodeURIComponent(inviteToken)}`
    : getSafeNextPath(searchParams.get("next"));
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteEmailLocked, setInviteEmailLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isReactivateSignup, setIsReactivateSignup] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "auth_callback") {
      setError(AUTH_CALLBACK_ERROR_MESSAGE);
    }
    if (searchParams.get("withdrawn") === "1") {
      setMessage(
        `회원 탈퇴가 완료되었습니다. 데이터는 ${ACCOUNT_DATA_RETENTION_DAYS}일간 보관된 뒤 삭제됩니다.`,
      );
    }
    if (searchParams.get("reactivate") === "1") {
      setMessage(REACTIVATE_LOGIN_MESSAGE);
      setMode("signup");
      setIsReactivateSignup(true);
    }
    if (searchParams.get("mode") === "signup" || inviteToken) {
      setMode("signup");
    }
  }, [searchParams, inviteToken]);

  useEffect(() => {
    if (!inviteToken) return;
    const token = inviteToken;

    async function loadInviteEmail() {
      try {
        const res = await fetch(
          `/api/org/invites/preview?token=${encodeURIComponent(token)}`,
        );
        const json = await res.json();
        if (json.success && json.data.invitedEmail) {
          setEmail(json.data.invitedEmail);
          setInviteEmailLocked(true);
        }
      } catch {
        // 미리보기 실패 시 사용자가 직접 입력
      }
    }

    void loadInviteEmail();
  }, [inviteToken]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setMessage(null);
    if (next !== "signup") {
      setIsReactivateSignup(false);
    }
  }

  async function handleReactivateSignup() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("이름을 입력해 주세요.");
      return;
    }

    const reactivateResult = await reactivateAccount({
      email,
      password,
      name: trimmedName,
    });

    if (!reactivateResult.success) {
      setError(reactivateResult.error);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;

    setIsReactivateSignup(false);
    await finishAuthWithInvite();
  }

  async function finishAuthWithInvite() {
    if (!inviteToken) {
      router.push(nextPath);
      router.refresh();
      return;
    }

    const acceptResult = await acceptInvite(inviteToken);
    if (acceptResult.success) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setError(acceptResult.error);
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
        if (!inviteToken) {
          const withdrawnStatus = await fetchWithdrawnStatus(email);
          if (!withdrawnStatus.success) {
            setError(withdrawnStatus.error);
            return;
          }

          if (withdrawnStatus.data.canReactivate) {
            await handleReactivateSignup();
            return;
          }

          if (withdrawnStatus.data.retentionExpired) {
            setError(getWithdrawnSignupMessage(true));
            return;
          }
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });

        if (signUpError) {
          const message = getAuthErrorMessage(signUpError).toLowerCase();
          if (
            !inviteToken &&
            (message.includes("already registered") ||
              message.includes("already been registered"))
          ) {
            const withdrawnStatus = await fetchWithdrawnStatus(email);
            if (withdrawnStatus.success && withdrawnStatus.data.canReactivate) {
              setIsReactivateSignup(true);
              setMessage(getWithdrawnSignupMessage(false));
              return;
            }
            if (
              withdrawnStatus.success &&
              withdrawnStatus.data.retentionExpired
            ) {
              setError(getWithdrawnSignupMessage(true));
              return;
            }
          }
          throw signUpError;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          await finishAuthWithInvite();
        } else {
          setMessage(
            inviteToken
              ? "확인 이메일을 보냈습니다. 메일함에서 인증을 완료하면 사무소에 자동으로 가입됩니다."
              : "확인 이메일을 보냈습니다. 메일함에서 인증을 완료한 뒤 로그인해 주세요.",
          );
        }
      } else {
        const withdrawnStatus = await fetchWithdrawnStatus(email);
        if (!withdrawnStatus.success) {
          setError(withdrawnStatus.error);
          return;
        }

        if (withdrawnStatus.data.canReactivate) {
          setMode("signup");
          setIsReactivateSignup(true);
          setMessage(REACTIVATE_LOGIN_MESSAGE);
          return;
        }

        if (withdrawnStatus.data.retentionExpired) {
          setError(getWithdrawnSignupMessage(true));
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        await finishAuthWithInvite();
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
        ? inviteToken
          ? "팀 초대 회원가입"
          : "회원가입"
        : "비밀번호 재설정";

  const description =
    mode === "login"
      ? inviteToken
        ? "초대받은 이메일 계정으로 로그인하면 사무소에 합류할 수 있습니다."
        : "TaxFlo 계정으로 로그인하세요."
      : mode === "signup"
        ? inviteToken
          ? "초대받은 이메일로 가입하면 사무소 팀원으로 등록됩니다."
          : isReactivateSignup
            ? REACTIVATE_SIGNUP_DESCRIPTION
            : "세무사 업무 자동화를 지금 시작하세요."
        : "가입한 이메일을 입력하시면 재설정 링크를 보내드립니다.";

  const submitLabel =
    mode === "login"
      ? inviteToken
        ? "로그인 후 합류"
        : "로그인"
      : mode === "signup"
        ? inviteToken
          ? "가입하고 합류하기"
          : isReactivateSignup
            ? "계정 복구하기"
            : "회원가입"
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
                required
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
              readOnly={inviteEmailLocked}
              className={inviteEmailLocked ? "bg-muted" : undefined}
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
              <PasswordInput
                id="password"
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
