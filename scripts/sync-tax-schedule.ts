import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

import type { Database } from "@/types/database";
import { syncTaxScheduleWithClient } from "@/lib/tax-schedule/sync-core";

function createScriptServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.");
  }

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function main() {
  console.log("국세청 세무일정 동기화를 시작합니다...");

  const supabase = createScriptServiceClient();
  const result = await syncTaxScheduleWithClient(supabase);

  console.log(JSON.stringify(result, null, 2));

  if (!result.success) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
