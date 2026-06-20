"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  formatKrw,
  getPlan,
  FREE_TRIAL,
  type BillingCycle,
  type PlanId,
} from "@/lib/plans";

const NICEPAY_SDK_URL =
  "https://pg-web.nicepay.co.kr/v3/common/js/nicepay-pgweb.js";

type NicepayFormFields = Record<string, string>;

type Props = {
  planId: PlanId;
  cycle: BillingCycle;
  amount: number;
};

declare global {
  interface Window {
    goPay?: (form: HTMLFormElement) => void;
    nicepaySubmit?: () => void;
    nicepayClose?: () => void;
  }
}

export function CheckoutForm({ planId, cycle, amount }: Props) {
  const plan = getPlan(planId);
  const formRef = useRef<HTMLFormElement>(null);
  const [agreeRecurring, setAgreeRecurring] = useState(false);
  const [agreeTrialCharge, setAgreeTrialCharge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formFields, setFormFields] = useState<NicepayFormFields | null>(null);
  const [actionUrl, setActionUrl] = useState("/api/billing/auth-callback");
  const [sdkReady, setSdkReady] = useState(false);
  const pendingOpen = useRef(false);

  const allAgreed = agreeRecurring && agreeTrialCharge && agreeTerms;

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

  async function handleCheckout() {
    if (!allAgreed) {
      setError("필수 동의 항목을 모두 체크해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          cycle,
          checkoutType: "subscription",
          agreeRecurring: true,
          agreeTrialCharge: true,
          agreeTerms: true,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "결제 준비에 실패했습니다.");
        return;
      }

      const fields = json.data.nicepayForm as NicepayFormFields;
      setActionUrl(json.data.returnUrl as string);
      pendingOpen.current = true;
      setFormFields(fields);
    } catch {
      setError("결제 준비 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border p-6">
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">선택 요금제</dt>
            <dd className="font-medium">{plan.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">월 결제금액</dt>
            <dd className="font-medium">{formatKrw(amount)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">무료 체험</dt>
            <dd className="font-medium">{FREE_TRIAL.days}일</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">결제수단</dt>
            <dd className="font-medium">신용/체크카드</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          체험 종료 후 매월 자동 결제됩니다. 부가세(10%)는 별도입니다.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-border p-6">
        <p className="text-sm font-medium">필수 동의</p>
        <ConsentItem
          id="agree-recurring"
          checked={agreeRecurring}
          onChange={setAgreeRecurring}
          label="매월 정기결제에 동의합니다."
        />
        <ConsentItem
          id="agree-trial"
          checked={agreeTrialCharge}
          onChange={setAgreeTrialCharge}
          label="무료 체험 종료 후 선택한 요금제로 자동 결제되는 것에 동의합니다."
        />
        <ConsentItem
          id="agree-terms"
          checked={agreeTerms}
          onChange={setAgreeTerms}
          label="서비스 이용약관 및 개인정보처리방침에 동의합니다."
        />
      </section>

      <section className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
        안전한 카드 등록을 위해 나이스페이 결제창으로 이동합니다.
        <br />
        TaxFlow는 카드번호를 저장하지 않습니다.
      </section>

      <form
        ref={formRef}
        name="nicepayForm"
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
        disabled={!allAgreed || loading || !sdkReady}
        onClick={() => void handleCheckout()}
      >
        {loading ? "준비 중..." : "카드 등록하고 무료 체험 시작"}
      </Button>

      <div className="text-center">
        <Link
          href="/billing"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          요금제 선택으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

function ConsentItem({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 rounded border-border"
      />
      <Label htmlFor={id} className="text-sm font-normal leading-relaxed">
        {label}
      </Label>
    </div>
  );
}
