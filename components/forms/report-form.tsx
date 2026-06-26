"use client";

import { useEffect, useRef, useState } from "react";

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
import { ReportExplanationOutput } from "@/components/forms/report-explanation-output";
import {
  ClientSelect,
} from "@/components/clients/client-select";
import {
  TAX_CHANGE_REASON_CHIPS,
  combineChangeReasons,
} from "@/lib/report-explanation/change-reasons";
import type { ReportExplanationSections } from "@/lib/report-explanation/output";
import { TAX_TYPE_LABELS, type TaxType } from "@/lib/constants";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

type DueDateSuggestion = {
  dueDate: string;
  dueDateLabel: string;
  eventTitle: string;
  eventNote: string | null;
};

type ApiResult =
  | {
      success: true;
      data: {
        id: string;
        result: string;
        sections: ReportExplanationSections;
      };
    }
  | { success: false; error: string };

type DueDateSuggestResult =
  | { success: true; data: { suggestion: DueDateSuggestion | null } }
  | { success: false; error: string };

export function ReportForm({
  canSelectClient,
  initialClientId = null,
}: {
  canSelectClient: boolean;
  initialClientId?: string | null;
}) {
  const [taxType, setTaxType] = useState<TaxType | "">("");
  const [clientId, setClientId] = useState<string | null>(initialClientId);
  const [currentTax, setCurrentTax] = useState("");
  const [previousTax, setPreviousTax] = useState("");
  const [selectedReasonChips, setSelectedReasonChips] = useState<string[]>([]);
  const [changeReason, setChangeReason] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueDateSuggestion, setDueDateSuggestion] =
    useState<DueDateSuggestion | null>(null);
  const [dueDateLoading, setDueDateLoading] = useState(false);
  const dueDateManuallyEdited = useRef(false);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [sections, setSections] = useState<ReportExplanationSections | null>(
    null,
  );

  useEffect(() => {
    if (!taxType) {
      setDueDateSuggestion(null);
      return;
    }

    let cancelled = false;

    async function loadDueDateSuggestion() {
      setDueDateLoading(true);
      try {
        const res = await fetch(
          `/api/tax-schedule/due-date-suggest?taxType=${taxType}`,
        );
        const json: DueDateSuggestResult = await res.json();
        if (cancelled) return;

        if (json.success && json.data.suggestion) {
          setDueDateSuggestion(json.data.suggestion);
          if (!dueDateManuallyEdited.current) {
            setDueDate(json.data.suggestion.dueDateLabel);
          }
        } else {
          setDueDateSuggestion(null);
        }
      } catch {
        if (!cancelled) {
          setDueDateSuggestion(null);
        }
      } finally {
        if (!cancelled) {
          setDueDateLoading(false);
        }
      }
    }

    void loadDueDateSuggestion();

    return () => {
      cancelled = true;
    };
  }, [taxType]);

  function handleTaxTypeChange(nextTaxType: TaxType | "") {
    setTaxType(nextTaxType);
    dueDateManuallyEdited.current = false;
    if (!nextTaxType) {
      setDueDate("");
      setDueDateSuggestion(null);
    }
  }

  function toggleReasonChip(chip: string) {
    setSelectedReasonChips((current) =>
      current.includes(chip)
        ? current.filter((item) => item !== chip)
        : [...current, chip],
    );
  }

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

    const effectiveChangeReason = combineChangeReasons(
      selectedReasonChips,
      changeReason,
    );

    setLoading(true);
    setResult(null);
    setSections(null);

    try {
      const res = await fetch("/api/report-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxType,
          currentTax: Number(currentTax),
          previousTax: previousTax.trim() ? Number(previousTax) : undefined,
          changeReason: effectiveChangeReason,
          dueDate: dueDate.trim() || undefined,
          memo: memo.trim() || undefined,
          clientId: clientId ?? undefined,
        }),
      });
      const json: ApiResult = await res.json();

      if (!json.success) {
        setError(json.error);
      } else {
        setResult(json.data.result);
        setSections(json.data.sections);
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
            <ClientSelect
              value={clientId}
              onChange={(nextId) => setClientId(nextId)}
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
                  onChange={(e) =>
                    handleTaxTypeChange(e.target.value as TaxType | "")
                  }
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

              <div className="space-y-2 sm:col-span-2">
                <Label>변동 사유 (선택)</Label>
                <div className="flex flex-wrap gap-2">
                  {TAX_CHANGE_REASON_CHIPS.map((chip) => {
                    const selected = selectedReasonChips.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        disabled={loading}
                        onClick={() => toggleReasonChip(chip)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition-colors",
                          selected
                            ? "border-foreground bg-foreground text-background"
                            : "border-input bg-transparent text-foreground hover:bg-muted/60",
                          loading && "cursor-not-allowed opacity-50",
                        )}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
                <Input
                  id="changeReason"
                  type="text"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="추가 사유가 있으면 입력하세요"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">납부기한 (선택)</Label>
                <Input
                  id="dueDate"
                  type="text"
                  value={dueDate}
                  onChange={(e) => {
                    dueDateManuallyEdited.current = true;
                    setDueDate(e.target.value);
                  }}
                  placeholder="예) 2026년 7월 25일"
                  disabled={loading}
                />
                {dueDateLoading && taxType && (
                  <p className="text-xs text-muted-foreground">
                    국세청 일정에서 납부기한을 찾는 중...
                  </p>
                )}
                {!dueDateLoading && dueDateSuggestion && (
                  <p className="text-xs text-muted-foreground">
                    국세청 일정 제안: {dueDateSuggestion.dueDateLabel} ·{" "}
                    {dueDateSuggestion.eventTitle}
                    {dueDateSuggestion.eventNote
                      ? ` (${dueDateSuggestion.eventNote})`
                      : ""}
                  </p>
                )}
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

      {result && sections && (
        <ReportExplanationOutput result={result} sections={sections} />
      )}
    </div>
  );
}
