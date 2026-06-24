import Link from "next/link";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata = {
  title: "비밀번호 재설정",
};

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <Link href="/" className="text-xl font-bold tracking-tight">
          TaxFlo
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">불러오는 중...</div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
