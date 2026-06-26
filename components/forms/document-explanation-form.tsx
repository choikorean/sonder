"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { LoadingButton } from "@/components/loading-button";
import { GeneratedOutput } from "@/components/generated-output";
import {
  ClientSelect,
  type ClientSelectOption,
} from "@/components/clients/client-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function DocumentExplanationForm({
  canSelectClient,
  initialClientId = null,
  initialTaxType = "",
  initialDocumentItems = "",
  initialCustomerQuestion = "",
}: {
  canSelectClient: boolean;
  initialClientId?: string | null;
  initialTaxType?: TaxType | "";
  initialDocumentItems?: string;
  initialCustomerQuestion?: string;
}) {
  const searchParams = useSearchParams();
  const [taxType, setTaxType] = useState<TaxType | "">(initialTaxType);
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [clientId, setClientId] = useState<string | null>(initialClientId);
  const [documentItems, setDocumentItems] = useState(initialDocumentItems);
  const [customerQuestion, setCustomerQuestion] = useState(
    initialCustomerQuestion ||
      searchParams.get("question") ||
      "홈택스에 다 있는 거 아닌가요?",
  );
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const items = searchParams.get("items");
    const tax = searchParams.get("taxType");
    const question = searchParams.get("question");
    const client = searchParams.get("clientId");
    if (items) setDocumentItems(items);
    if (tax && tax in TAX_TYPE_LABELS) setTaxType(tax as TaxType);
    if (question) setCustomerQuestion(question);
    if (client) setClientId(client);
  }, [searchParams]);

  function handleClientChange(
    nextClientId: string | null,
    client?: ClientSelectOption,
  ) {
    setClientId(nextClientId);
    if (client?.businessType) {
      setBusinessType(client.businessType);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!taxType) {
      setError("세목을 선택해 주세요.");
      return;
    }
    if (!documentItems.trim()) {
      setError("설명할 자료를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/document-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxType,
          businessType: businessType || undefined,
          documentItems: documentItems.trim(),
          customerQuestion: customerQuestion.trim() || undefined,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>자료 필요 이유 설명</CardTitle>
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
                <Label htmlFor="businessType">사업 유형 (선택)</Label>
                <select
                  id="businessType"
                  className={selectClassName}
                  value={businessType}
                  onChange={(e) =>
                    setBusinessType(e.target.value as BusinessType)
                  }
                  disabled={loading}
                >
                  <option value="">선택 안 함</option>
                  {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerQuestion">고객 질문 (선택)</Label>
              <Input
                id="customerQuestion"
                value={customerQuestion}
                onChange={(e) => setCustomerQuestion(e.target.value)}
                placeholder="예) 홈택스에 다 있는 거 아닌가요?"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentItems">설명할 자료</Label>
              <Textarea
                id="documentItems"
                value={documentItems}
                onChange={(e) => setDocumentItems(e.target.value)}
                placeholder="통장 내역, 카드 매출, 인건비 자료 등 (줄바꿈 또는 쉼표로 구분)"
                rows={5}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">특이사항 (선택)</Label>
              <Textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <LoadingButton type="submit" loading={loading} size="lg">
              {loading ? "생성 중..." : "설명문 생성"}
            </LoadingButton>
          </form>
        </CardContent>
      </Card>

      {result && (
        <GeneratedOutput title="자료 필요 이유 설명문" content={result} />
      )}

      <p className="text-sm text-muted-foreground">
        <Link
          href="/requests"
          className="font-medium text-foreground underline underline-offset-4"
        >
          자료 요청문 생성
        </Link>
        으로 돌아가기
      </p>
    </div>
  );
}
