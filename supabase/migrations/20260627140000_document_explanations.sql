-- Phase B: 자료 필요 이유 설명문 저장

CREATE TABLE IF NOT EXISTS public.document_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  tax_type text NOT NULL CHECK (
    tax_type IN (
      'VAT',
      'INCOME_TAX',
      'CORPORATE_TAX',
      'WITHHOLDING_TAX',
      'YEAR_END_SETTLEMENT'
    )
  ),
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
  document_items text NOT NULL,
  customer_question text,
  memo text,
  result text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_explanations_user_created_idx
  ON public.document_explanations (user_id, created_at DESC);

ALTER TABLE public.document_explanations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_explanations_select_own" ON public.document_explanations;
CREATE POLICY "document_explanations_select_own"
  ON public.document_explanations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "document_explanations_insert_own" ON public.document_explanations;
CREATE POLICY "document_explanations_insert_own"
  ON public.document_explanations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
