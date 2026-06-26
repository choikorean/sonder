"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ACCOUNT_DATA_RETENTION_DAYS } from "@/lib/account/withdraw";

export function DeleteAccountForm() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleWithdraw() {
    if (!confirmed) {
      setError("탈퇴 안내에 동의해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/account/withdraw", { method: "POST" });
      const json = await response.json();

      if (!json.success) {
        setError(json.error ?? "회원 탈퇴에 실패했습니다.");
        return;
      }

      router.push("/login?withdrawn=1");
      router.refresh();
    } catch {
      setError("회원 탈퇴 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border p-6">
      <div className="space-y-2">
        <h2 className="text-base font-semibold">회원 탈퇴</h2>
        <p className="text-sm text-muted-foreground">
          탈퇴 시 계정 로그인이 즉시 제한됩니다. 생성한 데이터는 탈퇴일로부터{" "}
          {ACCOUNT_DATA_RETENTION_DAYS}일간 보관된 뒤 영구 삭제됩니다.
        </p>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        <span>
          위 내용을 확인했으며, 데이터가 {ACCOUNT_DATA_RETENTION_DAYS}일간
          보관된 후 삭제됨에 동의합니다.
        </span>
      </label>

      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="button"
        variant="destructive"
        disabled={loading}
        onClick={() => void handleWithdraw()}
      >
        {loading ? "처리 중..." : "회원 탈퇴하기"}
      </Button>
    </div>
  );
}
