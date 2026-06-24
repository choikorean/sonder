"use client";

import { useState } from "react";

import { LoadingButton } from "@/components/loading-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GeneratedOutput } from "@/components/generated-output";
import {
  ClientSelect,
  type ClientSelectOption,
} from "@/components/clients/client-select";
import {
  TAX_TYPE_LABELS,
  BUSINESS_TYPE_LABELS,
  type TaxType,
  type BusinessType,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

type ApiResult =
  | { success: true; data: { id: string; result: string } }
  | { success: false; error: string };

export function RequestForm({
  canSelectClient,
  initialClientId = null,
}: {
  canSelectClient: boolean;
  initialClientId?: string | null;
}) {
  const [taxType, setTaxType] = useState<TaxType | "">("");
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [clientId, setClientId] = useState<string | null>(initialClientId);
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
    if (!businessType) {
      setError("사업 유형을 선택해 주세요.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/request-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxType,
          businessType,
          memo: memo.trim() || undefined,
          clientId: clientId ?? undefined,
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

  function handleClientChange(
    nextClientId: string | null,
    client?: ClientSelectOption,
  ) {
    setClientId(nextClientId);
    if (client?.businessType) {
      setBusinessType(client.businessType);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>요청 정보 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ClientSelect
              value={clientId}
              onChange={handleClientChange}
              disabled={loading}
              canSelectClient={canSelectClient}
            />

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
                <Label htmlFor="businessType">사업 유형</Label>
                <select
                  id="businessType"
                  className={selectClassName}
                  value={businessType}
                  onChange={(e) =>
                    setBusinessType(e.target.value as BusinessType)
                  }
                  disabled={loading}
                >
                  <option value="" disabled>
                    선택하세요
                  </option>
                  {Object.entries(BUSINESS_TYPE_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">특이사항 (선택)</Label>
              <Textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예) 신규 거래처, 간이과세자, 추가로 요청할 자료 등"
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

      {result && (
        <GeneratedOutput title="자료 요청문" content={result} />
      )}
    </div>
  );
}
