"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function RetryPaymentButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/retry", { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "결제에 실패했습니다.");
        return;
      }
      router.push("/settings/billing");
      router.refresh();
    } catch {
      setError("결제 재시도 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button disabled={loading} onClick={() => void handleRetry()}>
        {loading ? "결제 중..." : "다시 결제하기"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
