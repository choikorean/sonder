"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

const REASONS = [
  { id: "price", label: "가격이 부담됨" },
  { id: "low_usage", label: "사용 빈도가 낮음" },
  { id: "missing_features", label: "기능이 부족함" },
  { id: "other_service", label: "다른 서비스를 사용함" },
  { id: "other", label: "기타" },
] as const;

export function CancelSubscriptionForm() {
  const router = useRouter();
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || undefined }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "구독 해지에 실패했습니다.");
        return;
      }
      router.push("/settings/billing");
      router.refresh();
    } catch {
      setError("구독 해지 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
        <p>구독을 해지하시겠습니까?</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>해지 후에도 현재 결제기간 종료일까지 사용할 수 있습니다.</li>
          <li>다음 결제일부터 자동 결제되지 않습니다.</li>
        </ul>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">해지 사유를 알려주세요.</legend>
        {REASONS.map((item) => (
          <label key={item.id} className="flex items-center gap-3 text-sm">
            <input
              type="radio"
              name="cancel-reason"
              value={item.id}
              checked={reason === item.id}
              onChange={() => setReason(item.id)}
            />
            {item.label}
          </label>
        ))}
      </fieldset>

      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push("/settings/billing")}
        >
          구독 유지하기
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          disabled={loading}
          onClick={() => void handleCancel()}
        >
          {loading ? "처리 중..." : "구독 해지하기"}
        </Button>
      </div>
    </div>
  );
}
