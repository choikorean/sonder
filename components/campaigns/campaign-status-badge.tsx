import { CAMPAIGN_ITEM_STATUS_LABELS, type CampaignItemStatus } from "@/lib/document-campaign/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<CampaignItemStatus, string> = {
  not_requested: "bg-muted text-muted-foreground",
  requested: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100",
  partial: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  completed: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  rerequest_needed: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100",
};

export function CampaignStatusBadge({
  status,
  className,
}: {
  status: CampaignItemStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {CAMPAIGN_ITEM_STATUS_LABELS[status]}
    </span>
  );
}
