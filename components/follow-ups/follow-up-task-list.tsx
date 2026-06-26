"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { FollowUpTask } from "@/lib/follow-up/types";

type ApiResult =
  | { success: true; data: { task: FollowUpTask } }
  | { success: false; error: string };

type OrgMemberOption = {
  userId: string;
  name: string;
};

export function FollowUpTaskList({
  initialTasks,
  canAssign,
  orgMembers = [],
  showViewAllLink = false,
}: {
  initialTasks: FollowUpTask[];
  canAssign: boolean;
  orgMembers?: OrgMemberOption[];
  showViewAllLink?: boolean;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  if (tasks.length === 0) {
    return null;
  }

  async function patchTask(
    taskId: string,
    body: { status?: "pending" | "done"; assignedUserId?: string | null },
  ) {
    setUpdatingId(taskId);
    setError(null);

    try {
      const res = await fetch(`/api/follow-up-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: ApiResult = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? json.data.task : task,
        ),
      );
    } catch {
      setError("후속 조치 업데이트에 실패했습니다.");
    } finally {
      setUpdatingId(null);
    }
  }

  const pendingCount = tasks.filter((task) => task.status === "pending").length;

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">후속 조치 체크리스트</h3>
          <p className="text-xs text-muted-foreground">
            미완료 {pendingCount.toLocaleString()}건
          </p>
        </div>
        {showViewAllLink && (
          <Link
            href="/follow-ups"
            className="text-sm font-medium text-foreground underline underline-offset-4"
          >
            전체 보기
          </Link>
        )}
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => {
          const isDone = task.status === "done";
          const isUpdating = updatingId === task.id;

          return (
            <li
              key={task.id}
              className={cn(
                "flex flex-col gap-2 rounded-md border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
                isDone && "bg-muted/40",
              )}
            >
              <label className="flex min-w-0 flex-1 items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={isDone}
                  disabled={isUpdating}
                  onChange={(event) =>
                    patchTask(task.id, {
                      status: event.target.checked ? "done" : "pending",
                    })
                  }
                />
                <span
                  className={cn(
                    "leading-relaxed break-words",
                    isDone && "text-muted-foreground line-through",
                  )}
                >
                  {task.title}
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-2 pl-7 sm:pl-0">
                {task.clientName && (
                  <span className="text-xs text-muted-foreground">
                    {task.clientName}
                  </span>
                )}
                {canAssign && orgMembers.length > 0 && (
                  <select
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    value={task.assignedUserId ?? ""}
                    disabled={isUpdating}
                    onChange={(event) =>
                      patchTask(task.id, {
                        assignedUserId: event.target.value || null,
                      })
                    }
                  >
                    <option value="">담당자 미지정</option>
                    {orgMembers.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                )}
                {!canAssign && task.assignedUserName && (
                  <span className="text-xs text-muted-foreground">
                    담당: {task.assignedUserName}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
