import { NextResponse, type NextRequest } from "next/server";

import { acceptOrganizationInvite } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

function parseJoinToken(next: string): string | null {
  if (!next.startsWith("/join")) {
    return null;
  }

  const query = next.includes("?") ? next.slice(next.indexOf("?") + 1) : "";
  const token = new URLSearchParams(query).get("token")?.trim();
  return token || null;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(url);
  }

  const inviteToken = parseJoinToken(next);
  if (inviteToken) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      try {
        const service = createServiceClient();
        await acceptOrganizationInvite(service, {
          token: inviteToken,
          userId: user.id,
        });
        return NextResponse.redirect(new URL("/dashboard", origin));
      } catch {
        return NextResponse.redirect(new URL(next, origin));
      }
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
