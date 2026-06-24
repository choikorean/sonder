-- Team 멀티유저: organizations, members, invites + RLS 확장

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) > 0),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat_limit integer NOT NULL DEFAULT 5 CHECK (seat_limit > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organizations_owner_user_id_idx
  ON public.organizations (owner_user_id);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS organization_members_one_active_org_per_user
  ON public.organization_members (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS organization_members_org_status_idx
  ON public.organization_members (organization_id, status);

CREATE TABLE IF NOT EXISTS public.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organization_invites_org_idx
  ON public.organization_invites (organization_id, created_at DESC);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_organization_id_unique
  ON public.subscriptions (organization_id)
  WHERE organization_id IS NOT NULL;

ALTER TABLE public.saved_phrases
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- =====================================================
-- RLS helpers
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_org_member(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = p_organization_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = p_organization_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_organization_with(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om_self
    JOIN public.organization_members om_target
      ON om_self.organization_id = om_target.organization_id
    WHERE om_self.user_id = auth.uid()
      AND om_target.user_id = p_user_id
      AND om_self.status = 'active'
      AND om_target.status = 'active'
  );
$$;

-- =====================================================
-- organizations / members / invites RLS
-- =====================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_select_member" ON public.organizations;
CREATE POLICY "organizations_select_member"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(id) OR auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "organization_members_select_org" ON public.organization_members;
CREATE POLICY "organization_members_select_org"
  ON public.organization_members FOR SELECT
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "organization_invites_select_admin" ON public.organization_invites;
CREATE POLICY "organization_invites_select_admin"
  ON public.organization_invites FOR SELECT
  USING (public.is_org_admin(organization_id));

DROP POLICY IF EXISTS "organization_invites_insert_admin" ON public.organization_invites;
CREATE POLICY "organization_invites_insert_admin"
  ON public.organization_invites FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

-- =====================================================
-- profiles: 팀원 프로필 조회
-- =====================================================

DROP POLICY IF EXISTS "profiles_select_org_members" ON public.profiles;
CREATE POLICY "profiles_select_org_members"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.shares_organization_with(id));

-- =====================================================
-- subscriptions: 팀원 구독 조회
-- =====================================================

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_org"
  ON public.subscriptions FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      organization_id IS NOT NULL
      AND public.is_org_member(organization_id)
    )
  );

-- =====================================================
-- generation tables: 팀 공유 이력 조회
-- =====================================================

DROP POLICY IF EXISTS "request_generations_select_own" ON public.request_generations;
CREATE POLICY "request_generations_select_own_or_org"
  ON public.request_generations FOR SELECT
  USING (auth.uid() = user_id OR public.shares_organization_with(user_id));

DROP POLICY IF EXISTS "consultation_summaries_select_own" ON public.consultation_summaries;
CREATE POLICY "consultation_summaries_select_own_or_org"
  ON public.consultation_summaries FOR SELECT
  USING (auth.uid() = user_id OR public.shares_organization_with(user_id));

DROP POLICY IF EXISTS "report_explanations_select_own" ON public.report_explanations;
CREATE POLICY "report_explanations_select_own_or_org"
  ON public.report_explanations FOR SELECT
  USING (auth.uid() = user_id OR public.shares_organization_with(user_id));

-- =====================================================
-- saved_phrases: 사무소 공통 템플릿 팀 공유
-- =====================================================

DROP POLICY IF EXISTS "saved_phrases_select_own" ON public.saved_phrases;
CREATE POLICY "saved_phrases_select_own_or_office"
  ON public.saved_phrases FOR SELECT
  USING (
    (scope = 'personal' AND auth.uid() = user_id)
    OR (
      scope = 'office'
      AND organization_id IS NOT NULL
      AND public.is_org_member(organization_id)
    )
  );

DROP POLICY IF EXISTS "saved_phrases_insert_own" ON public.saved_phrases;
CREATE POLICY "saved_phrases_insert_own_or_office"
  ON public.saved_phrases FOR INSERT
  WITH CHECK (
    (scope = 'personal' AND auth.uid() = user_id)
    OR (
      scope = 'office'
      AND auth.uid() = user_id
      AND organization_id IS NOT NULL
      AND public.is_org_member(organization_id)
    )
  );

DROP POLICY IF EXISTS "saved_phrases_update_own" ON public.saved_phrases;
CREATE POLICY "saved_phrases_update_own_or_office"
  ON public.saved_phrases FOR UPDATE
  USING (
    (scope = 'personal' AND auth.uid() = user_id)
    OR (
      scope = 'office'
      AND organization_id IS NOT NULL
      AND public.is_org_member(organization_id)
    )
  )
  WITH CHECK (
    (scope = 'personal' AND auth.uid() = user_id)
    OR (
      scope = 'office'
      AND organization_id IS NOT NULL
      AND public.is_org_member(organization_id)
    )
  );

DROP POLICY IF EXISTS "saved_phrases_delete_own" ON public.saved_phrases;
CREATE POLICY "saved_phrases_delete_own_or_office"
  ON public.saved_phrases FOR DELETE
  USING (
    (scope = 'personal' AND auth.uid() = user_id)
    OR (
      scope = 'office'
      AND organization_id IS NOT NULL
      AND public.is_org_member(organization_id)
    )
  );

-- =====================================================
-- updated_at trigger for organizations
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_organizations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_organizations_updated_at();
