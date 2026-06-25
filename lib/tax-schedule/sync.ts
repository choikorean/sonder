import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  syncTaxScheduleWithClient,
  type SyncTaxScheduleOptions,
} from "@/lib/tax-schedule/sync-core";
import type { TaxScheduleSyncResult } from "@/lib/tax-schedule/types";

export type { SyncTaxScheduleOptions };

export async function syncTaxSchedule(
  options: SyncTaxScheduleOptions = {},
): Promise<TaxScheduleSyncResult> {
  return syncTaxScheduleWithClient(createServiceClient(), options);
}
