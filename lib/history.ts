import type { createClient } from "@/lib/supabase/server";
import { retentionCutoffIso } from "@/lib/copy-formats";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

const LIMIT = 50;

export type RequestHistoryItem = {
  id: string;
  taxType: string;
  businessType: string;
  memo: string | null;
  result: string;
  createdAt: string;
  authorName: string | null;
  clientId: string | null;
  clientName: string | null;
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
  authorName: string | null;
  clientId: string | null;
  clientName: string | null;
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
  authorName: string | null;
  clientId: string | null;
  clientName: string | null;
};

export type HistoryData = {
  requests: RequestHistoryItem[];
  consultations: ConsultationHistoryItem[];
  reports: ReportHistoryItem[];
};

function displayAuthorName(
  name: string | null | undefined,
  officeName: string | null | undefined,
  email: string | null | undefined,
) {
  return name?.trim() || officeName?.trim() || email?.trim() || null;
}

async function loadAuthorNameMap(
  supabase: SupabaseServer,
  userIds: string[],
): Promise<Map<string, string | null>> {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, name, office_name, email")
    .in("id", uniqueIds);

  return new Map(
    (data ?? []).map((profile) => [
      profile.id,
      displayAuthorName(profile.name, profile.office_name, profile.email),
    ]),
  );
}

async function loadClientNameMap(
  supabase: SupabaseServer,
  clientIds: string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(clientIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data } = await supabase
    .from("clients")
    .select("id, name")
    .in("id", uniqueIds);

  return new Map((data ?? []).map((client) => [client.id, client.name]));
}

export async function getHistory(
  supabase: SupabaseServer,
  options?: {
    retentionDays?: number;
    authorName?: string | null;
    clientId?: string | null;
  },
): Promise<HistoryData> {
  const cutoff = retentionCutoffIso(options?.retentionDays ?? 0);
  const fallbackAuthorName = options?.authorName ?? null;

  let requestsQuery = supabase
    .from("request_generations")
    .select(
      "id, user_id, tax_type, business_type, memo, result, created_at, client_id",
    )
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  let consultationsQuery = supabase
    .from("consultation_summaries")
    .select(
      "id, user_id, summary, client_summary, required_documents, next_actions, next_guidance, transcript, audio_url, created_at, client_id",
    )
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  let reportsQuery = supabase
    .from("report_explanations")
    .select(
      "id, user_id, tax_type, current_tax, previous_tax, change_reason, due_date, memo, result, created_at, client_id",
    )
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  if (options?.clientId) {
    requestsQuery = requestsQuery.eq("client_id", options.clientId);
    consultationsQuery = consultationsQuery.eq("client_id", options.clientId);
    reportsQuery = reportsQuery.eq("client_id", options.clientId);
  }

  if (cutoff) {
    requestsQuery = requestsQuery.gte("created_at", cutoff);
    consultationsQuery = consultationsQuery.gte("created_at", cutoff);
    reportsQuery = reportsQuery.gte("created_at", cutoff);
  }

  const [requests, consultations, reports] = await Promise.all([
    requestsQuery,
    consultationsQuery,
    reportsQuery,
  ]);

  const userIds = [
    ...(requests.data ?? []).map((row) => row.user_id),
    ...(consultations.data ?? []).map((row) => row.user_id),
    ...(reports.data ?? []).map((row) => row.user_id),
  ];
  const clientIds = [
    ...(requests.data ?? []).map((row) => row.client_id),
    ...(consultations.data ?? []).map((row) => row.client_id),
    ...(reports.data ?? []).map((row) => row.client_id),
  ];
  const [authorNames, clientNames] = await Promise.all([
    loadAuthorNameMap(supabase, userIds),
    loadClientNameMap(
      supabase,
      clientIds.filter((id): id is string => id != null),
    ),
  ]);

  return {
    requests: (requests.data ?? []).map((row) => ({
      id: row.id,
      taxType: row.tax_type,
      businessType: row.business_type,
      memo: row.memo,
      result: row.result,
      createdAt: row.created_at,
      authorName: authorNames.get(row.user_id) ?? fallbackAuthorName,
      clientId: row.client_id,
      clientName: row.client_id ? (clientNames.get(row.client_id) ?? null) : null,
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
      authorName: authorNames.get(row.user_id) ?? fallbackAuthorName,
      clientId: row.client_id,
      clientName: row.client_id ? (clientNames.get(row.client_id) ?? null) : null,
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
      authorName: authorNames.get(row.user_id) ?? fallbackAuthorName,
      clientId: row.client_id,
      clientName: row.client_id ? (clientNames.get(row.client_id) ?? null) : null,
    })),
  };
}
