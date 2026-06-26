-- 회원 탈퇴(soft delete) — 데이터 30일 보관

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
  ADD COLUMN IF NOT EXISTS hard_delete_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_withdrawn_at_idx
  ON public.profiles (withdrawn_at)
  WHERE withdrawn_at IS NOT NULL;
