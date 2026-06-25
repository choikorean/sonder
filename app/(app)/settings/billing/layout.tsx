import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { resolveCanManageBilling } from "@/lib/billing/access";

export default async function BillingSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await resolveCanManageBilling(supabase, user.id))) {
    redirect("/settings");
  }

  return children;
}
