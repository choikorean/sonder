-- 국세청 세무일정 (Phase 1: 수집·동기화)

CREATE TABLE IF NOT EXISTS public.tax_schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date date NOT NULL,
  title text NOT NULL,
  note text,
  tax_categories text[] NOT NULL DEFAULT '{}',
  source_year integer NOT NULL,
  source_month integer NOT NULL CHECK (source_month BETWEEN 1 AND 12),
  source_url text NOT NULL,
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tax_schedule_events_unique_idx
  ON public.tax_schedule_events (event_date, title, COALESCE(note, ''));

CREATE INDEX IF NOT EXISTS tax_schedule_events_event_date_idx
  ON public.tax_schedule_events (event_date);

CREATE INDEX IF NOT EXISTS tax_schedule_events_source_idx
  ON public.tax_schedule_events (source_year, source_month);

CREATE TABLE IF NOT EXISTS public.tax_schedule_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  window_start date NOT NULL,
  window_end date NOT NULL,
  months_processed integer NOT NULL DEFAULT 0,
  events_upserted integer NOT NULL DEFAULT 0,
  events_deleted integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS tax_schedule_sync_runs_started_at_idx
  ON public.tax_schedule_sync_runs (started_at DESC);

ALTER TABLE public.tax_schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_schedule_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tax_schedule_events_select_authenticated" ON public.tax_schedule_events;
CREATE POLICY "tax_schedule_events_select_authenticated"
  ON public.tax_schedule_events FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "tax_schedule_sync_runs_select_authenticated" ON public.tax_schedule_sync_runs;
CREATE POLICY "tax_schedule_sync_runs_select_authenticated"
  ON public.tax_schedule_sync_runs FOR SELECT
  TO authenticated
  USING (true);
