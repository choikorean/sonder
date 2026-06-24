-- Pro/Team 고객(CRM) 등록 — Phase 1

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  contact_name text,
  business_type text CHECK (
    business_type IS NULL
    OR business_type IN (
      'SOLE',
      'CORPORATION',
      'FREELANCER',
      'ECOMMERCE',
      'RESTAURANT',
      'SERVICE',
      'ETC'
    )
  ),
  phone text,
  email text,
  memo text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clients_user_active_idx
  ON public.clients (user_id, name)
  WHERE organization_id IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS clients_org_active_idx
  ON public.clients (organization_id, name)
  WHERE organization_id IS NOT NULL AND is_active = true;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_own_or_org" ON public.clients;
CREATE POLICY "clients_select_own_or_org"
  ON public.clients FOR SELECT
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

DROP POLICY IF EXISTS "clients_insert_own_or_org" ON public.clients;
CREATE POLICY "clients_insert_own_or_org"
  ON public.clients FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      (
        organization_id IS NULL
        AND auth.uid() = user_id
      )
      OR (
        organization_id IS NOT NULL
        AND public.is_org_member(organization_id)
      )
    )
  );

DROP POLICY IF EXISTS "clients_update_own_or_org" ON public.clients;
CREATE POLICY "clients_update_own_or_org"
  ON public.clients FOR UPDATE
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

CREATE OR REPLACE FUNCTION public.set_clients_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_updated_at ON public.clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_clients_updated_at();
