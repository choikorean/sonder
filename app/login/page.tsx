import Link from "next/link";

import { AuthForm } from "@/components/forms/auth-form";

export const metadata = {
  title: "로그인",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <Link href="/" className="text-xl font-bold tracking-tight">
          TaxFlo
        </Link>
      </div>
      <AuthForm />
      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">
        AI가 생성한 초안입니다. 고객 발송 전 세무사가 반드시 검토해야 합니다.
      </p>
    </main>
  );
}
