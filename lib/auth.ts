import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * 현재 로그인한 사용자와 서버 Supabase 클라이언트를 함께 반환합니다.
 * Route Handler에서 인증 확인 및 RLS 적용 쿼리에 사용합니다.
 */
export async function getAuthContext(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
