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
  options?: { organizationId?: string | null; userId?: string | null },
): Promise<SavedPhrase[]> {
  if (!capabilities.savedPhrases && !capabilities.officeSharedPhrases) {
    return [];
  }

  const { data: auth } = await supabase.auth.getUser();
  const userId = options?.userId ?? auth.user?.id;
  if (!userId) return [];

  const queries = [];

  if (capabilities.savedPhrases) {
    queries.push(
      supabase
        .from("saved_phrases")
        .select("id, label, content, scope, created_at")
        .eq("scope", "personal")
        .eq("user_id", userId),
    );
  }

  if (capabilities.officeSharedPhrases && options?.organizationId) {
    queries.push(
      supabase
        .from("saved_phrases")
        .select("id, label, content, scope, created_at")
        .eq("scope", "office")
        .eq("organization_id", options.organizationId),
    );
  }

  const results = await Promise.all(queries);
  const rows = results.flatMap((result) => result.data ?? []);

  return rows
    .map((row) => ({
      id: row.id,
      label: row.label,
      content: row.content,
      scope: row.scope as "personal" | "office",
      createdAt: row.created_at,
    }))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getPhraseContentsForPrompt(
  supabase: SupabaseServer,
  capabilities: PlanCapabilities,
  options?: { organizationId?: string | null; userId?: string | null },
  limit = 5,
): Promise<string[]> {
  const phrases = await listSavedPhrases(supabase, capabilities, options);
  return phrases.slice(0, limit).map((p) => p.content);
}
