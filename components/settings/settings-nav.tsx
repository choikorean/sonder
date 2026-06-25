import Link from "next/link";

import { getSettingsLinks } from "@/lib/settings-nav";
import { cn } from "@/lib/utils";

type Props = {
  activeHref: string;
  canManageBilling: boolean;
};

export function SettingsNav({ activeHref, canManageBilling }: Props) {
  const links = getSettingsLinks(canManageBilling);

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted",
            item.href === activeHref
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
