import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import JoinOrganizationPage from "./join-client";

export const metadata = {
  title: "사무소 초대",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim();

  if (token) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(
        `/login?mode=signup&invite=${encodeURIComponent(token)}`,
      );
    }
  }

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
        <JoinOrganizationPage />
      </Suspense>
    </main>
  );
}
