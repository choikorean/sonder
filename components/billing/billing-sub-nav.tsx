"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/settings/billing", label: "현재 요금제" },
  { href: "/settings/billing/payment-method", label: "결제수단" },
  { href: "/settings/billing/invoices", label: "결제내역" },
  { href: "/settings/billing/cancel", label: "구독 해지" },
] as const;

export function BillingSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm transition-colors",
            pathname === link.href
              ? "bg-foreground text-background"
              : "border border-border text-muted-foreground hover:bg-muted",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
