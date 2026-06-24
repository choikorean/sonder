"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import { type BusinessType } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ClientSelectOption = {
  id: string;
  name: string;
  contactName: string | null;
  businessType: BusinessType | null;
};

type ClientsApiResponse =
  | {
      success: true;
      data: {
        clients: Array<{
          id: string;
          name: string;
          contactName: string | null;
          businessType: BusinessType | null;
        }>;
      };
    }
  | { success: false; error: string };

const selectClassName = cn(
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

type ClientSelectProps = {
  value: string | null;
  onChange: (clientId: string | null, client?: ClientSelectOption) => void;
  disabled?: boolean;
  canSelectClient: boolean;
  label?: string;
  emptyLabel?: string;
};

export function ClientSelect({
  value,
  onChange,
  disabled = false,
  canSelectClient,
  label = "고객 연결 (선택)",
  emptyLabel = "선택 안 함",
}: ClientSelectProps) {
  const [clients, setClients] = useState<ClientSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const syncedInitialRef = useRef(false);

  useEffect(() => {
    if (!canSelectClient) return;

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetch("/api/clients")
      .then(async (res) => {
        const json = (await res.json()) as ClientsApiResponse;
        if (cancelled) return;
        if (!json.success) {
          setLoadError(json.error);
          setClients([]);
          return;
        }
        setClients(
          json.data.clients.map((client) => ({
            id: client.id,
            name: client.name,
            contactName: client.contactName,
            businessType: client.businessType,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("고객 목록을 불러오지 못했습니다.");
          setClients([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canSelectClient]);

  useEffect(() => {
    if (
      syncedInitialRef.current ||
      !value ||
      loading ||
      clients.length === 0
    ) {
      return;
    }

    const client = clients.find((item) => item.id === value);
    if (client) {
      syncedInitialRef.current = true;
      onChange(value, client);
    }
  }, [value, loading, clients, onChange]);

  if (!canSelectClient) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        등록된 고객과 연결해 생성하려면{" "}
        <Link
          href="/settings/billing"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Pro·Team 요금제
        </Link>
        가 필요합니다.{" "}
        <Link
          href="/settings/clients"
          className="font-medium text-foreground underline underline-offset-4"
        >
          고객 관리
        </Link>
        에서 먼저 고객을 등록할 수 있습니다.
      </div>
    );
  }

  function handleChange(nextId: string) {
    if (!nextId) {
      onChange(null);
      return;
    }
    const client = clients.find((item) => item.id === nextId);
    onChange(nextId, client);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="clientId">{label}</Label>
      <select
        id="clientId"
        className={selectClassName}
        value={value ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled || loading}
      >
        <option value="">{emptyLabel}</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
            {client.contactName ? ` (${client.contactName})` : ""}
          </option>
        ))}
      </select>
      {loading && (
        <p className="text-xs text-muted-foreground">고객 목록 불러오는 중…</p>
      )}
      {loadError && (
        <p className="text-xs text-destructive" role="alert">
          {loadError}
        </p>
      )}
      {!loading && !loadError && clients.length === 0 && (
        <p className="text-xs text-muted-foreground">
          등록된 고객이 없습니다.{" "}
          <Link
            href="/settings/clients"
            className="font-medium text-foreground underline underline-offset-4"
          >
            고객 등록
          </Link>
        </p>
      )}
    </div>
  );
}
