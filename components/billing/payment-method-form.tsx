"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { BillingCycle, PlanId } from "@/lib/plans";

const NICEPAY_SDK_URL =
  "https://pg-web.nicepay.co.kr/v3/common/js/nicepay-pgweb.js";

type NicepayFormFields = Record<string, string>;

type Props = {
  planId: PlanId;
  cycle: BillingCycle;
};

declare global {
  interface Window {
    goPay?: (form: HTMLFormElement) => void;
    nicepaySubmit?: () => void;
    nicepayClose?: () => void;
  }
}

export function PaymentMethodForm({ planId, cycle }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<NicepayFormFields | null>(null);
  const [actionUrl, setActionUrl] = useState("/api/billing/auth-callback");
  const [sdkReady, setSdkReady] = useState(false);
  const pendingOpen = useRef(false);

  useEffect(() => {
    if (document.querySelector(`script[src="${NICEPAY_SDK_URL}"]`)) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = NICEPAY_SDK_URL;
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    window.nicepaySubmit = () => formRef.current?.submit();
    window.nicepayClose = () => setError("카드 등록이 취소되었습니다.");
    return () => {
      delete window.nicepaySubmit;
      delete window.nicepayClose;
    };
  }, []);

  useEffect(() => {
    if (!pendingOpen.current || !formFields || !formRef.current) return;
    if (typeof window.goPay !== "function") {
      setError("나이스페이 결제창을 열 수 없습니다.");
      pendingOpen.current = false;
      return;
    }
    window.goPay(formRef.current);
    pendingOpen.current = false;
  }, [formFields]);

  async function handleChangeCard() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/change-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, cycle }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "결제수단 변경 준비에 실패했습니다.");
        return;
      }

      const fields = json.data.nicepayForm as NicepayFormFields;
      setActionUrl(json.data.returnUrl as string);
      pendingOpen.current = true;
      setFormFields(fields);
    } catch {
      setError("결제수단 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        새 카드 등록이 완료된 후 기존 결제수단은 자동으로 교체됩니다.
        TaxFlo는 카드번호를 저장하지 않습니다.
      </p>

      <form
        ref={formRef}
        name="nicepayChangeForm"
        method="post"
        action={actionUrl}
        acceptCharset={formFields?.CharSet ?? "utf-8"}
        className="hidden"
      >
        {formFields &&
          Object.entries(formFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
      </form>

      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        className="w-full"
        disabled={loading || !sdkReady}
        onClick={() => void handleChangeCard()}
      >
        {loading ? "준비 중..." : "새 카드 등록하기"}
      </Button>
    </div>
  );
}
