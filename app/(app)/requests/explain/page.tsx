import Link from "next/link";
import { Suspense } from "react";

import { DocumentExplanationForm } from "@/components/forms/document-explanation-form";
import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import type { TaxType } from "@/lib/constants";

export const metadata = {
  title: "자료 필요 이유 설명",
};

const TAX_TYPES = new Set<string>([
  "VAT",
  "INCOME_TAX",
  "CORPORATE_TAX",
  "WITHHOLDING_TAX",
  "YEAR_END_SETTLEMENT",
]);

function parseTaxType(value?: string): TaxType | "" {
  if (!value || !TAX_TYPES.has(value)) return "";
  return value as TaxType;
}

export default async function DocumentExplanationPage({
  searchParams,
}: {
  searchParams: Promise<{
    clientId?: string;
    taxType?: string;
    items?: string;
    question?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const ctx = await getSubscriberContext(supabase);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/requests"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← 자료 요청 생성
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">자료 필요 이유 설명</h1>
        <p className="text-sm text-muted-foreground">
          「홈택스에 다 있는 거 아닌가요?」 같은 고객 질문에 답할 카카오톡용 설명 초안을
          생성합니다.
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">불러오는 중...</p>}>
        <DocumentExplanationForm
          canSelectClient={ctx.capabilities.clientProfiles}
          initialClientId={params.clientId ?? null}
          initialTaxType={parseTaxType(params.taxType)}
          initialDocumentItems={params.items ?? ""}
          initialCustomerQuestion={params.question ?? ""}
        />
      </Suspense>
    </div>
  );
}
