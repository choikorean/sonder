"use client";

import { useState } from "react";

import { LoadingButton } from "@/components/loading-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GeneratedOutput } from "@/components/generated-output";
import { TAX_TYPE_LABELS, type TaxType } from "@/lib/constants";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

type ApiResult =
  | { success: true; data: { id: string; result: string } }
  | { success: false; error: string };

export function ReportForm() {
  const [taxType, setTaxType] = useState<TaxType | "">("");
  const [currentTax, setCurrentTax] = useState("");
  const [previousTax, setPreviousTax] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!taxType) {
      setError("세목을 선택해 주세요.");
      return;
    }
    if (!currentTax.trim()) {
      setError("이번 신고 세액을 입력해 주세요.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/report-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxType,
          currentTax: Number(currentTax),
          previousTax: previousTax.trim() ? Number(previousTax) : undefined,
          changeReason: changeReason.trim() || undefined,
          memo: memo.trim() || undefined,
        }),
      });
      const json: ApiResult = await res.json();

      if (!json.success) {
        setError(json.error);
      } else {
        setResult(json.data.result);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>신고 결과 정보 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxType">세목</Label>
                <select
                  id="taxType"
                  className={selectClassName}
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value as TaxType)}
                  disabled={loading}
                >
                  <option value="" disabled>
                    선택하세요
                  </option>
                  {Object.entries(TAX_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentTax">이번 신고 세액 (원)</Label>
                <Input
                  id="currentTax"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={currentTax}
                  onChange={(e) => setCurrentTax(e.target.value)}
                  placeholder="예) 4500000"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previousTax">이전 신고 세액 (원, 선택)</Label>
                <Input
                  id="previousTax"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={previousTax}
                  onChange={(e) => setPreviousTax(e.target.value)}
                  placeholder="예) 2100000"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="changeReason">변동 사유 (선택)</Label>
                <Input
                  id="changeReason"
                  type="text"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="예) 매출 증가"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">특이사항 (선택)</Label>
              <Textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예) 분납 안내, 추가 공제 적용 등 고객에게 함께 전달할 내용"
                rows={4}
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <LoadingButton type="submit" loading={loading} size="lg">
              {loading ? "생성 중..." : "생성하기"}
            </LoadingButton>
          </form>
        </CardContent>
      </Card>

      {result && <GeneratedOutput title="신고 결과 설명문" content={result} />}
    </div>
  );
}
