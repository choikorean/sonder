import { createClient } from "@/lib/supabase/server";
import { getHistory } from "@/lib/history";
import { HistoryView } from "@/components/history-view";

export const metadata = {
  title: "생성 내역",
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const data = await getHistory(supabase);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">생성 내역</h1>
        <p className="text-sm text-muted-foreground">
          이전에 생성한 결과를 확인하고 복사할 수 있습니다.
        </p>
      </div>
      <HistoryView data={data} />
    </div>
  );
}
