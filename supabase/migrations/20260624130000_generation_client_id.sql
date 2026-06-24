-- CRM Phase 2: 생성 이력에 고객 연결
ALTER TABLE request_generations
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE consultation_summaries
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE report_explanations
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_request_generations_client_id
  ON request_generations(client_id)
  WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultation_summaries_client_id
  ON consultation_summaries(client_id)
  WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_report_explanations_client_id
  ON report_explanations(client_id)
  WHERE client_id IS NOT NULL;
