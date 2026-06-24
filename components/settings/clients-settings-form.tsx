"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, UserX, History } from "lucide-react";

import { LoadingButton } from "@/components/loading-button";
import { Button } from "@/components/ui/button";
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
  BUSINESS_TYPE_LABELS,
  type BusinessType,
} from "@/lib/constants";
import { STARTER_UNAVAILABLE_FEATURES } from "@/lib/plans";
import { cn } from "@/lib/utils";

type ClientItem = {
  id: string;
  name: string;
  contactName: string | null;
  businessType: BusinessType | null;
  phone: string | null;
  email: string | null;
  memo: string | null;
  isActive: boolean;
};

type ListResult =
  | {
      success: true;
      data: {
        clients: ClientItem[];
        activeCount: number;
        limit: number;
        isTeamShared: boolean;
      };
    }
  | { success: false; error: string };

const selectClassName = cn(
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

const emptyForm = {
  name: "",
  contactName: "",
  businessType: "" as BusinessType | "",
  phone: "",
  email: "",
  memo: "",
};

export function ClientsSettingsForm({
  canManage,
  isTrialing,
}: {
  canManage: boolean;
  isTrialing: boolean;
}) {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [limit, setLimit] = useState(0);
  const [isTeamShared, setIsTeamShared] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadClients(includeInactive = showInactive) {
    const query = includeInactive ? "?includeInactive=1" : "";
    const res = await fetch(`/api/clients${query}`);
    const json: ListResult = await res.json();
    if (json.success) {
      setClients(json.data.clients);
      setActiveCount(json.data.activeCount);
      setLimit(json.data.limit);
      setIsTeamShared(json.data.isTeamShared);
    } else if (res.status !== 403) {
      setError(json.error);
    }
  }

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    void loadClients().finally(() => setLoading(false));
  }, [canManage]);

  useEffect(() => {
    if (!canManage || loading) return;
    void loadClients(showInactive);
  }, [showInactive, canManage, loading]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  }

  function startEdit(client: ClientItem) {
    setEditingId(client.id);
    setForm({
      name: client.name,
      contactName: client.contactName ?? "",
      businessType: client.businessType ?? "",
      phone: client.phone ?? "",
      email: client.email ?? "",
      memo: client.memo ?? "",
    });
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      contactName: form.contactName.trim() || undefined,
      businessType: form.businessType || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      memo: form.memo.trim() || undefined,
    };

    try {
      const res = await fetch(
        editingId ? `/api/clients/${editingId}` : "/api/clients",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }
      resetForm();
      await loadClients(showInactive);
    } catch {
      setError("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateClient(id: string) {
    if (!confirm("이 고객을 비활성화할까요? 기존 생성 내역은 유지됩니다.")) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }
      if (editingId === id) resetForm();
      await loadClients(showInactive);
    } catch {
      setError("비활성화에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>고객 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            고객 등록·고객별 이력은 Pro·Team 요금제(또는 무료 체험)에서 이용할
            수 있습니다.
          </p>
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="font-medium">Starter 플랜에서 이용할 수 없는 기능</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
              {STARTER_UNAVAILABLE_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
          <Link
            href="/billing"
            className="inline-block font-medium text-foreground underline underline-offset-4"
          >
            요금제 변경하기
          </Link>
        </CardContent>
      </Card>
    );
  }

  const atLimit = activeCount >= limit && limit > 0;

  return (
    <div className="space-y-6">
      {isTrialing && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          무료 체험 중에는 고객 등록을 포함한 Pro·Team 기능을 이용할 수
          있습니다. 체험 후{" "}
          <span className="font-medium text-foreground">Starter</span>로 전환하면
          고객 관리·고객별 이력 등 일부 기능을 사용할 수 없습니다.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? "고객 정보 수정" : "고객 등록"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="client-name">고객명(상호) *</Label>
                <Input
                  id="client-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예) ○○상사"
                  required
                  disabled={saving || (!editingId && atLimit)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-contact">담당자명</Label>
                <Input
                  id="client-contact"
                  value={form.contactName}
                  onChange={(e) =>
                    setForm({ ...form, contactName: e.target.value })
                  }
                  placeholder="예) 홍길동"
                  disabled={saving || (!editingId && atLimit)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-business">사업 유형</Label>
                <select
                  id="client-business"
                  value={form.businessType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      businessType: e.target.value as BusinessType | "",
                    })
                  }
                  className={selectClassName}
                  disabled={saving || (!editingId && atLimit)}
                >
                  <option value="">선택 안 함</option>
                  {(Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {BUSINESS_TYPE_LABELS[key]}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-phone">연락처</Label>
                <Input
                  id="client-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="예) 010-1234-5678"
                  disabled={saving || (!editingId && atLimit)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-email">이메일</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  disabled={saving || (!editingId && atLimit)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="client-memo">메모</Label>
                <Textarea
                  id="client-memo"
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  placeholder="예) 간이과세, 카톡 선호, 자료 늦음 등"
                  rows={3}
                  disabled={saving || (!editingId && atLimit)}
                />
              </div>
            </div>

            {atLimit && !editingId && (
              <p className="text-sm text-muted-foreground">
                활성 고객 한도({limit.toLocaleString()}명)에 도달했습니다. 새
                고객을 등록하려면 기존 고객을 비활성화해 주세요.
              </p>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <LoadingButton
                type="submit"
                loading={saving}
                disabled={!editingId && atLimit}
              >
                {editingId ? "수정 저장" : "고객 등록"}
              </LoadingButton>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  취소
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>등록 고객</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {isTeamShared
                ? "사무소 구성원이 공유하는 고객 목록입니다."
                : "본인 계정에 등록된 고객 목록입니다."}{" "}
              활성 {activeCount.toLocaleString()} / {limit.toLocaleString()}명
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="size-4 rounded border border-input"
            />
            비활성 포함
          </label>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          ) : clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              등록된 고객이 없습니다. 위에서 첫 고객을 등록해 보세요.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {clients.map((client) => (
                <li
                  key={client.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{client.name}</p>
                      {!client.isActive && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          비활성
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {[
                        client.contactName && `담당 ${client.contactName}`,
                        client.businessType &&
                          BUSINESS_TYPE_LABELS[client.businessType],
                        client.phone,
                        client.email,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "추가 정보 없음"}
                    </p>
                    {client.memo && (
                      <p className="text-sm text-muted-foreground">
                        메모: {client.memo}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <Link
                      href={`/history?clientId=${client.id}`}
                      className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
                    >
                      <History className="size-3.5" />
                      생성 내역
                    </Link>
                    {client.isActive && (
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(client)}
                          disabled={saving}
                        >
                          <Pencil className="size-4" />
                          수정
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => deactivateClient(client.id)}
                          disabled={saving}
                        >
                          <UserX className="size-4" />
                          비활성화
                        </Button>
                      </div>
                    )}
                    {client.isActive && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        <Link
                          href={`/requests?clientId=${client.id}`}
                          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                          자료 요청
                        </Link>
                        <Link
                          href={`/consultations?clientId=${client.id}`}
                          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                          상담 요약
                        </Link>
                        <Link
                          href={`/reports?clientId=${client.id}`}
                          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                          설명문
                        </Link>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
