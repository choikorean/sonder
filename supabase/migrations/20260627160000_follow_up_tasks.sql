-- Phase D: 상담 후속 조치 체크리스트

CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  consultation_id uuid REFERENCES public.consultation_summaries(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS follow_up_tasks_user_status_idx
  ON public.follow_up_tasks (user_id, status, created_at DESC)
  WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS follow_up_tasks_org_status_idx
  ON public.follow_up_tasks (organization_id, status, created_at DESC)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS follow_up_tasks_consultation_idx
  ON public.follow_up_tasks (consultation_id);

ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follow_up_tasks_select" ON public.follow_up_tasks;
CREATE POLICY "follow_up_tasks_select"
  ON public.follow_up_tasks FOR SELECT
  USING (
    (
      organization_id IS NULL
      AND auth.uid() = user_id
    )
    OR (
      organization_id IS NOT NULL
      AND public.is_org_member(organization_id)
    )
  );

DROP POLICY IF EXISTS "follow_up_tasks_insert" ON public.follow_up_tasks;
CREATE POLICY "follow_up_tasks_insert"
  ON public.follow_up_tasks FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      organization_id IS NULL
      OR public.is_org_member(organization_id)
    )
  );

DROP POLICY IF EXISTS "follow_up_tasks_update" ON public.follow_up_tasks;
CREATE POLICY "follow_up_tasks_update"
  ON public.follow_up_tasks FOR UPDATE
  USING (
    (
      organization_id IS NULL
      AND auth.uid() = user_id
    )
    OR (
      organization_id IS NOT NULL
      AND public.is_org_member(organization_id)
    )
  )
  WITH CHECK (
    (
      organization_id IS NULL
      AND auth.uid() = user_id
    )
    OR (
      organization_id IS NOT NULL
      AND public.is_org_member(organization_id)
    )
  );

DROP POLICY IF EXISTS "follow_up_tasks_delete" ON public.follow_up_tasks;
CREATE POLICY "follow_up_tasks_delete"
  ON public.follow_up_tasks FOR DELETE
  USING (
    (
      organization_id IS NULL
      AND auth.uid() = user_id
    )
    OR (
      organization_id IS NOT NULL
      AND public.is_org_member(organization_id)
    )
  );

CREATE OR REPLACE FUNCTION public.set_follow_up_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done' THEN
    NEW.completed_at = now();
  ELSIF NEW.status = 'pending' AND OLD.status IS DISTINCT FROM 'pending' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS follow_up_tasks_updated_at ON public.follow_up_tasks;
CREATE TRIGGER follow_up_tasks_updated_at
  BEFORE UPDATE ON public.follow_up_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_follow_up_tasks_updated_at();
