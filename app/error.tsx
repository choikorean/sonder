"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Error({
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
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight">
        일시적인 오류가 발생했습니다
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 페이지를 새로고침해 주세요.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>다시 시도</Button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
