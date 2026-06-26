"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
import { TAX_TYPE_LABELS, type TaxType } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Preset = {
  id: string;
  label: string;
  taxType: TaxType;
  title: string;
  memo: string;
  submissionDeadlineLabel: string;
};

type ClientOption = {
  id: string;
  name: string;
};

const selectClassName = cn(
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

export function CampaignCreateForm() {
  const router = useRouter();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [submissionDeadlineLabel, setSubmissionDeadlineLabel] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [presetRes, clientRes] = await Promise.all([
        fetch("/api/campaigns/presets"),
        fetch("/api/clients"),
      ]);
      const presetJson = await presetRes.json();
      const clientJson = await clientRes.json();

      if (presetJson.success) {
        setPresets(presetJson.data.presets);
      }
      if (clientJson.success) {
        setClients(
          clientJson.data.clients.map((client: ClientOption) => ({
            id: client.id,
            name: client.name,
          })),
        );
      } else {
        setError(clientJson.error ?? "고객 목록을 불러오지 못했습니다.");
      }
    }

    void load();
  }, []);

  function applyPreset(presetId: string) {
    setSelectedPresetId(presetId);
    const preset = presets.find((row) => row.id === presetId);
    if (!preset) return;
    setTitle(preset.title);
    setMemo(preset.memo);
    setSubmissionDeadlineLabel(preset.submissionDeadlineLabel);
  }

  function toggleClient(clientId: string) {
    setSelectedClientIds((current) =>
      current.includes(clientId)
        ? current.filter((id) => id !== clientId)
        : [...current, clientId],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (selectedClientIds.length === 0) {
      setError("캠페인에 포함할 고객을 1명 이상 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          memo: memo.trim() || undefined,
          seasonPresetId: selectedPresetId || undefined,
          submissionDeadlineLabel: submissionDeadlineLabel.trim() || undefined,
          clientIds: selectedClientIds,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }
      router.push(`/campaigns/${json.data.campaign.id}`);
      router.refresh();
    } catch {
      setError("캠페인 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const activePreset = presets.find((row) => row.id === selectedPresetId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 자료 요청 캠페인</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="preset">시즌 프리셋</Label>
            <select
              id="preset"
              className={selectClassName}
              value={selectedPresetId}
              onChange={(e) => applyPreset(e.target.value)}
              disabled={loading}
            >
              <option value="">직접 입력</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
            {activePreset && (
              <p className="text-xs text-muted-foreground">
                세목: {TAX_TYPE_LABELS[activePreset.taxType]} · 제출 기한 안내:{" "}
                {activePreset.submissionDeadlineLabel}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">캠페인 제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 2026년 1기 확정 부가세 자료 요청"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">자료 제출 기한 안내</Label>
            <Input
              id="deadline"
              value={submissionDeadlineLabel}
              onChange={(e) => setSubmissionDeadlineLabel(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">캠페인 공통 특이사항</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label>포함할 고객</Label>
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={() =>
                  setSelectedClientIds(clients.map((client) => client.id))
                }
              >
                전체 선택
              </button>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  등록된 고객이 없습니다.{" "}
                  <Link href="/settings/clients" className="underline">
                    고객 관리
                  </Link>
                  에서 먼저 등록해 주세요.
                </p>
              ) : (
                clients.map((client) => (
                  <label
                    key={client.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClientIds.includes(client.id)}
                      onChange={() => toggleClient(client.id)}
                      disabled={loading}
                    />
                    <span>{client.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <LoadingButton type="submit" loading={loading} size="lg">
            캠페인 만들기
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  );
}
