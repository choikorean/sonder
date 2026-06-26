"use client";

import { useCallback, useEffect, useState } from "react";

import { FollowUpTaskList } from "@/components/follow-ups/follow-up-task-list";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FollowUpTask } from "@/lib/follow-up/types";
import { ListTodo } from "lucide-react";

type ApiResult =
  | { success: true; data: { tasks: FollowUpTask[] } }
  | { success: false; error: string };

type OrgMemberOption = {
  userId: string;
  name: string;
};

const TABS = [
  { value: "pending", label: "미완료" },
  { value: "done", label: "완료" },
  { value: "all", label: "전체" },
] as const;

export function FollowUpsPageClient({
  initialTasks,
  initialStatus,
  canAssign,
  orgMembers,
}: {
  initialTasks: FollowUpTask[];
  initialStatus: "pending" | "done" | "all";
  canAssign: boolean;
  orgMembers: OrgMemberOption[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [tasks, setTasks] = useState(initialTasks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async (nextStatus: typeof status) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/follow-up-tasks?status=${nextStatus}`);
      const json: ApiResult = await res.json();
      if (!json.success) {
        setError(json.error);
      } else {
        setTasks(json.data.tasks);
      }
    } catch {
      setError("후속 조치 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks(status);
  }, [status, loadTasks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              status === tab.value
                ? "border-foreground bg-foreground text-background"
                : "border-input bg-transparent text-foreground hover:bg-muted/60",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground">불러오는 중...</Card>
      ) : error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={
            status === "pending"
              ? "미완료 후속 조치가 없습니다"
              : "표시할 후속 조치가 없습니다"
          }
          description="상담 요약을 생성하면 내부 후속 조치가 체크리스트로 추가됩니다."
        />
      ) : (
        <FollowUpTaskList
          initialTasks={tasks}
          canAssign={canAssign}
          orgMembers={orgMembers}
        />
      )}
    </div>
  );
}
