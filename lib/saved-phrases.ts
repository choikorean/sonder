import type { createClient } from "@/lib/supabase/server";
import type { PlanCapabilities } from "@/lib/plan-capabilities";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export type SavedPhrase = {
  id: string;
  label: string;
  content: string;
  scope: "personal" | "office";
  createdAt: string;
};

export async function listSavedPhrases(
  supabase: SupabaseServer,
  capabilities: PlanCapabilities,
): Promise<SavedPhrase[]> {
  if (!capabilities.savedPhrases && !capabilities.officeSharedPhrases) {
    return [];
  }

  let query = supabase
    .from("saved_phrases")
    .select("id, label, content, scope, created_at")
    .order("created_at", { ascending: false });

  if (capabilities.officeSharedPhrases) {
    query = query.in("scope", ["personal", "office"]);
  } else {
    query = query.eq("scope", "personal");
  }

  const { data } = await query;
  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    content: row.content,
    scope: row.scope as "personal" | "office",
    createdAt: row.created_at,
  }));
}

export async function getPhraseContentsForPrompt(
  supabase: SupabaseServer,
  capabilities: PlanCapabilities,
  limit = 5,
): Promise<string[]> {
  const phrases = await listSavedPhrases(supabase, capabilities);
  return phrases.slice(0, limit).map((p) => p.content);
}
