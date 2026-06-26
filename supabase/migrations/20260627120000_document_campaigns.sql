-- Phase A: 자료 요청 캠페인 · 고객별 제출 상태 추적

CREATE TABLE IF NOT EXISTS public.document_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  tax_type text NOT NULL CHECK (
    tax_type IN (
      'VAT',
      'INCOME_TAX',
      'CORPORATE_TAX',
      'WITHHOLDING_TAX',
      'YEAR_END_SETTLEMENT'
    )
  ),
  memo text,
  season_preset_id text,
  submission_deadline_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_campaigns_user_idx
  ON public.document_campaigns (user_id, created_at DESC)
  WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS document_campaigns_org_idx
  ON public.document_campaigns (organization_id, created_at DESC)
  WHERE organization_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.document_campaign_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.document_campaigns(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_requested' CHECK (
    status IN (
      'not_requested',
      'requested',
      'partial',
      'completed',
      'rerequest_needed'
    )
  ),
  missing_items text,
  last_request_id uuid REFERENCES public.request_generations(id) ON DELETE SET NULL,
  last_rerequest_id uuid REFERENCES public.request_generations(id) ON DELETE SET NULL,
  requested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, client_id)
);

CREATE INDEX IF NOT EXISTS document_campaign_items_campaign_idx
  ON public.document_campaign_items (campaign_id, status);

ALTER TABLE public.request_generations
  ADD COLUMN IF NOT EXISTS campaign_item_id uuid
    REFERENCES public.document_campaign_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_request_generations_campaign_item_id
  ON public.request_generations (campaign_item_id)
  WHERE campaign_item_id IS NOT NULL;

ALTER TABLE public.document_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_campaign_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_campaigns_select" ON public.document_campaigns;
CREATE POLICY "document_campaigns_select"
  ON public.document_campaigns FOR SELECT
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

DROP POLICY IF EXISTS "document_campaigns_insert" ON public.document_campaigns;
CREATE POLICY "document_campaigns_insert"
  ON public.document_campaigns FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      organization_id IS NULL
      OR public.is_org_member(organization_id)
    )
  );

DROP POLICY IF EXISTS "document_campaigns_update" ON public.document_campaigns;
CREATE POLICY "document_campaigns_update"
  ON public.document_campaigns FOR UPDATE
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

DROP POLICY IF EXISTS "document_campaigns_delete" ON public.document_campaigns;
CREATE POLICY "document_campaigns_delete"
  ON public.document_campaigns FOR DELETE
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

DROP POLICY IF EXISTS "document_campaign_items_select" ON public.document_campaign_items;
CREATE POLICY "document_campaign_items_select"
  ON public.document_campaign_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.document_campaigns c
      WHERE c.id = document_campaign_items.campaign_id
        AND (
          (c.organization_id IS NULL AND c.user_id = auth.uid())
          OR (
            c.organization_id IS NOT NULL
            AND public.is_org_member(c.organization_id)
          )
        )
    )
  );

DROP POLICY IF EXISTS "document_campaign_items_insert" ON public.document_campaign_items;
CREATE POLICY "document_campaign_items_insert"
  ON public.document_campaign_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.document_campaigns c
      WHERE c.id = document_campaign_items.campaign_id
        AND (
          (c.organization_id IS NULL AND c.user_id = auth.uid())
          OR (
            c.organization_id IS NOT NULL
            AND public.is_org_member(c.organization_id)
          )
        )
    )
  );

DROP POLICY IF EXISTS "document_campaign_items_update" ON public.document_campaign_items;
CREATE POLICY "document_campaign_items_update"
  ON public.document_campaign_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.document_campaigns c
      WHERE c.id = document_campaign_items.campaign_id
        AND (
          (c.organization_id IS NULL AND c.user_id = auth.uid())
          OR (
            c.organization_id IS NOT NULL
            AND public.is_org_member(c.organization_id)
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.document_campaigns c
      WHERE c.id = document_campaign_items.campaign_id
        AND (
          (c.organization_id IS NULL AND c.user_id = auth.uid())
          OR (
            c.organization_id IS NOT NULL
            AND public.is_org_member(c.organization_id)
          )
        )
    )
  );

DROP POLICY IF EXISTS "document_campaign_items_delete" ON public.document_campaign_items;
CREATE POLICY "document_campaign_items_delete"
  ON public.document_campaign_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.document_campaigns c
      WHERE c.id = document_campaign_items.campaign_id
        AND (
          (c.organization_id IS NULL AND c.user_id = auth.uid())
          OR (
            c.organization_id IS NOT NULL
            AND public.is_org_member(c.organization_id)
          )
        )
    )
  );

CREATE OR REPLACE FUNCTION public.set_document_campaigns_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS document_campaigns_updated_at ON public.document_campaigns;
CREATE TRIGGER document_campaigns_updated_at
  BEFORE UPDATE ON public.document_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_document_campaigns_updated_at();

CREATE OR REPLACE FUNCTION public.set_document_campaign_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS document_campaign_items_updated_at ON public.document_campaign_items;
CREATE TRIGGER document_campaign_items_updated_at
  BEFORE UPDATE ON public.document_campaign_items
  FOR EACH ROW EXECUTE FUNCTION public.set_document_campaign_items_updated_at();
