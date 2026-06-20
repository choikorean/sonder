"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export type NicepayFormFields = {
  GoodsName: string;
  Amt: string;
  MID: string;
  EdiDate: string;
  Moid: string;
  PayMethod: string;
  BillAuthYN: string;
  SignData: string;
  BuyerEmail: string;
  BuyerName: string;
  BuyerTel: string;
  CharSet: string;
  ReturnURL: string;
  ReqReserved: string;
};

const NICEPAY_SDK_URL =
  "https://pg-web.nicepay.co.kr/v3/common/js/nicepay-pgweb.js";

type Props = {
  formFields: NicepayFormFields | null;
  actionUrl: string;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
};

declare global {
  interface Window {
    goPay?: (form: HTMLFormElement) => void;
    nicepaySubmit?: () => void;
    nicepayClose?: () => void;
  }
}

export function NicepayAuthButton({
  formFields,
  actionUrl,
  disabled,
  loading,
  children,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document.querySelector(`script[src="${NICEPAY_SDK_URL}"]`)) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = NICEPAY_SDK_URL;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () =>
      setError("나이스페이 결제 모듈을 불러오지 못했습니다.");
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    window.nicepaySubmit = () => {
      formRef.current?.submit();
    };
    window.nicepayClose = () => {
      setError("카드 등록이 취소되었습니다.");
    };

    return () => {
      delete window.nicepaySubmit;
      delete window.nicepayClose;
    };
  }, []);

  function handleClick() {
    setError(null);

    if (!formFields || !formRef.current) {
      setError("결제 정보가 준비되지 않았습니다.");
      return;
    }

    if (!sdkReady || typeof window.goPay !== "function") {
      setError(
        "나이스페이 결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.",
      );
      return;
    }

    window.goPay(formRef.current);
  }

  return (
    <div className="space-y-3">
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

      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading || !formFields}
        className="w-full"
      >
        {loading ? "준비 중..." : children}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
