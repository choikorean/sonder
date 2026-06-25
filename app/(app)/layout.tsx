import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { AppNav } from "@/components/layout/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const ctx = await getSubscriberContext(supabase);

  return (
    <div className="flex min-h-full flex-col">
      <AppNav
        email={user.email ?? ""}
        canManageBilling={ctx.canManageBilling}
      />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </div>
    </div>
  );
}
