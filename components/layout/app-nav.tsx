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
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            TaxFlow
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted",
                  isActive(item.href)
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground lg:inline">
            {email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            disabled={signingOut}
            className="hidden md:inline-flex"
          >
            <LogOut className="size-4" />
            로그아웃
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border md:hidden">
          <nav className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-3 sm:px-6">
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
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <span className="truncate text-sm text-muted-foreground">
                {email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
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
