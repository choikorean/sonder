import { TriangleAlert } from "lucide-react";

import { REVIEW_DISCLAIMER } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ReviewDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <TriangleAlert className="size-4 shrink-0" />
      <span>{REVIEW_DISCLAIMER}</span>
    </p>
  );
}
