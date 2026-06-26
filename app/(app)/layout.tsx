import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { AppNav } from "@/components/layout/app-nav";
import { SiteFooter } from "@/components/layout/site-footer";

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
        canManageBilling={ctx.canManageBilling}
        canUseClientProfiles={ctx.capabilities.clientProfiles}
      />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
