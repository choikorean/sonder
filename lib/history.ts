import type { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

const LIMIT = 50;

export type RequestHistoryItem = {
  id: string;
  taxType: string;
  businessType: string;
  memo: string | null;
  result: string;
  createdAt: string;
};

export type ConsultationHistoryItem = {
  id: string;
  summary: string;
  clientSummary: string;
  requiredDocuments: string | null;
  nextActions: string | null;
  nextGuidance: string | null;
  transcript: string | null;
  hasAudio: boolean;
  createdAt: string;
};

export type ReportHistoryItem = {
  id: string;
  taxType: string;
  currentTax: number;
  previousTax: number | null;
  changeReason: string | null;
  dueDate: string | null;
  memo: string | null;
  result: string;
  createdAt: string;
};

export type HistoryData = {
  requests: RequestHistoryItem[];
  consultations: ConsultationHistoryItem[];
  reports: ReportHistoryItem[];
};

export async function getHistory(supabase: SupabaseServer): Promise<HistoryData> {
  const [requests, consultations, reports] = await Promise.all([
    supabase
      .from("request_generations")
      .select("id, tax_type, business_type, memo, result, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("consultation_summaries")
        .select(
          "id, summary, client_summary, required_documents, next_actions, next_guidance, transcript, audio_url, created_at",
        )
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("report_explanations")
        .select(
          "id, tax_type, current_tax, previous_tax, change_reason, due_date, memo, result, created_at",
        )
      .order("created_at", { ascending: false })
      .limit(LIMIT),
  ]);

  return {
    requests: (requests.data ?? []).map((row) => ({
      id: row.id,
      taxType: row.tax_type,
      businessType: row.business_type,
      memo: row.memo,
      result: row.result,
      createdAt: row.created_at,
    })),
    consultations: (consultations.data ?? []).map((row) => ({
      id: row.id,
      summary: row.summary,
      clientSummary: row.client_summary,
        requiredDocuments: row.required_documents,
        nextActions: row.next_actions,
        nextGuidance: row.next_guidance,
        transcript: row.transcript,
        hasAudio: row.audio_url != null,
        createdAt: row.created_at,
      })),
    reports: (reports.data ?? []).map((row) => ({
      id: row.id,
      taxType: row.tax_type,
        currentTax: row.current_tax,
        previousTax: row.previous_tax,
        changeReason: row.change_reason,
        dueDate: row.due_date,
        memo: row.memo,
        result: row.result,
        createdAt: row.created_at,
      })),
  };
}
