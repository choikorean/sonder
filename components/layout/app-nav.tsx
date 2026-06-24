"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/requests", label: "자료 요청 생성" },
  { href: "/consultations", label: "상담 요약" },
  { href: "/reports", label: "신고 결과 설명문" },
  { href: "/history", label: "생성 내역" },
  { href: "/settings", label: "설정" },
  { href: "/billing", label: "요금제" },
  { href: "/settings/billing", label: "결제 및 구독" },
] as const;

export function AppNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link
          href="/dashboard"
          className="shrink-0 text-lg font-bold tracking-tight"
        >
          TaxFlo
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
          aria-label="주요 메뉴"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-muted xl:px-3",
                isActive(item.href)
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <span
            className="hidden max-w-[7rem] truncate text-sm text-muted-foreground sm:max-w-[9rem] lg:inline xl:max-w-[12rem]"
            title={email}
          >
            {email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={signingOut}
            className="hidden shrink-0 lg:inline-flex"
          >
            <LogOut className="size-4" />
            <span className="hidden xl:inline">로그아웃</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border lg:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                  isActive(item.href)
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-3">
              <span
                className="min-w-0 truncate text-sm text-muted-foreground"
                title={email}
              >
                {email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
                className="shrink-0"
              >
                <LogOut className="size-4" />
                로그아웃
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
