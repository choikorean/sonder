"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h2 className="text-xl font-semibold tracking-tight">
        화면을 불러오지 못했습니다
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        일시적인 오류일 수 있습니다. 다시 시도해 주세요.
      </p>
      <Button onClick={reset} className="mt-6">
        다시 시도
      </Button>
    </div>
  );
}
