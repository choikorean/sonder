import Link from "next/link";
import { Suspense } from "react";

import { AuthForm } from "@/components/forms/auth-form";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = {
  title: "로그인",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col">
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
          <AuthForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
