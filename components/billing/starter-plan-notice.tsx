import Link from "next/link";

import { STARTER_UNAVAILABLE_FEATURES } from "@/lib/plans";

export function StarterPlanNotice() {
  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-sm">
      <p className="font-medium">Starter 플랜에서 이용할 수 없는 기능</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
        {STARTER_UNAVAILABLE_FEATURES.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        무료 체험 중 등록한 고객 정보는 Starter로 전환 후 조회·생성에 사용할 수
        없습니다.{" "}
        <Link
          href="/settings/billing"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Pro·Team으로 업그레이드
        </Link>
        하면 다시 이용할 수 있습니다.
      </p>
    </div>
  );
}
