CREATE TABLE IF NOT EXISTS public.saved_phrases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(trim(label)) > 0),
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  scope text NOT NULL DEFAULT 'personal' CHECK (scope IN ('personal', 'office')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_phrases_user_id_idx ON public.saved_phrases (user_id);
CREATE INDEX IF NOT EXISTS saved_phrases_scope_idx ON public.saved_phrases (user_id, scope);

ALTER TABLE public.saved_phrases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_phrases_select_own" ON public.saved_phrases;
CREATE POLICY "saved_phrases_select_own"
  ON public.saved_phrases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_phrases_insert_own" ON public.saved_phrases;
CREATE POLICY "saved_phrases_insert_own"
  ON public.saved_phrases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_phrases_update_own" ON public.saved_phrases;
CREATE POLICY "saved_phrases_update_own"
  ON public.saved_phrases FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_phrases_delete_own" ON public.saved_phrases;
CREATE POLICY "saved_phrases_delete_own"
  ON public.saved_phrases FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_saved_phrases_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saved_phrases_updated_at ON public.saved_phrases;
CREATE TRIGGER saved_phrases_updated_at
  BEFORE UPDATE ON public.saved_phrases
  FOR EACH ROW EXECUTE FUNCTION public.set_saved_phrases_updated_at();
