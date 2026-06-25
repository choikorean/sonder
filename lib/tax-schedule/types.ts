export type TaxScheduleEvent = {
  id: string;
  eventDate: string;
  title: string;
  note: string | null;
  taxCategories: string[];
};

export type TaxScheduleSyncMeta = {
  lastSyncedAt: string;
  windowStart: string;
  windowEnd: string;
};

export type ParsedTaxScheduleEvent = {
  eventDate: string;
  title: string;
  note: string | null;
  sourceUrl: string;
  contentHash: string;
};

export type TaxScheduleSyncMonthError = {
  year: number;
  month: number;
  message: string;
};

export type TaxScheduleSyncResult = {
  success: boolean;
  monthsProcessed: number;
  monthsSucceeded: number;
  eventsUpserted: number;
  eventsDeleted: number;
  windowStart: string;
  windowEnd: string;
  errors: TaxScheduleSyncMonthError[];
  runId: string | null;
};
