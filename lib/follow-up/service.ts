import "server-only";

import { resolveClientScope } from "@/lib/clients";
import { parseNextActions } from "@/lib/follow-up/parse-actions";
import type {
  FollowUpDashboardStats,
  FollowUpTask,
  FollowUpTaskStatus,
} from "@/lib/follow-up/types";
import type { SubscriberContext } from "@/lib/subscriber-context";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export class FollowUpAccessError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

function resolveFollowUpScope(ctx: SubscriberContext, userId: string) {
  const scope = resolveClientScope({
    subscription: ctx.subscription,
    organizationId: ctx.organization?.id,
  });

  return {
    userId,
    organizationId: scope.organizationId,
  };
}

function mapFollowUpTaskRow(row: {
  id: string;
  title: string;
  status: string;
  consultation_id: string | null;
  client_id: string | null;
  assigned_user_id: string | null;
  sort_order: number;
  created_at: string;
  completed_at: string | null;
  clients: { name: string } | null;
}): FollowUpTask {
  return {
    id: row.id,
    title: row.title,
    status: row.status as FollowUpTaskStatus,
    consultationId: row.consultation_id,
    clientId: row.client_id,
    clientName: row.clients?.name ?? null,
    assignedUserId: row.assigned_user_id,
    assignedUserName: null,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

async function attachAssigneeNames(
  supabase: SupabaseServer,
  tasks: FollowUpTask[],
): Promise<FollowUpTask[]> {
  const assigneeIds = [
    ...new Set(
      tasks
        .map((task) => task.assignedUserId)
        .filter((id): id is string => id != null),
    ),
  ];

  if (assigneeIds.length === 0) {
    return tasks;
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, office_name, email")
    .in("id", assigneeIds);

  const nameById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile.name?.trim() ||
        profile.office_name?.trim() ||
        profile.email?.trim() ||
        "이름 없음",
    ]),
  );

  return tasks.map((task) => ({
    ...task,
    assignedUserName: task.assignedUserId
      ? (nameById.get(task.assignedUserId) ?? null)
      : null,
  }));
}

export async function createFollowUpTasksFromConsultation(
  supabase: SupabaseServer,
  params: {
    ctx: SubscriberContext;
    userId: string;
    consultationId: string;
    clientId: string | null;
    nextActions: string | null;
  },
): Promise<FollowUpTask[]> {
  const items = parseNextActions(params.nextActions);
  if (items.length === 0) {
    return [];
  }

  const scope = resolveFollowUpScope(params.ctx, params.userId);
  const rows = items.map((title, index) => ({
    user_id: params.userId,
    organization_id: scope.organizationId,
    consultation_id: params.consultationId,
    client_id: params.clientId,
    title,
    sort_order: index,
  }));

  const { data, error } = await supabase
    .from("follow_up_tasks")
    .insert(rows)
    .select(
      "id, title, status, consultation_id, client_id, assigned_user_id, sort_order, created_at, completed_at, clients(name)",
    );

  if (error || !data) {
    throw new Error("후속 조치 저장에 실패했습니다.");
  }

  return attachAssigneeNames(
    supabase,
    data.map((row) =>
      mapFollowUpTaskRow({
        ...row,
        clients: Array.isArray(row.clients) ? row.clients[0] ?? null : row.clients,
      }),
    ),
  );
}

export async function listFollowUpTasks(
  supabase: SupabaseServer,
  params: {
    ctx: SubscriberContext;
    userId: string;
    status?: FollowUpTaskStatus | "all";
    limit?: number;
  },
): Promise<FollowUpTask[]> {
  const scope = resolveFollowUpScope(params.ctx, params.userId);

  let query = supabase
    .from("follow_up_tasks")
    .select(
      "id, title, status, consultation_id, client_id, assigned_user_id, sort_order, created_at, completed_at, clients(name)",
    )
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 100);

  if (scope.organizationId) {
    query = query.eq("organization_id", scope.organizationId);
  } else {
    query = query.eq("user_id", params.userId).is("organization_id", null);
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("후속 조치 목록을 불러오지 못했습니다.");
  }

  return attachAssigneeNames(
    supabase,
    (data ?? []).map((row) =>
      mapFollowUpTaskRow({
        ...row,
        clients: Array.isArray(row.clients) ? row.clients[0] ?? null : row.clients,
      }),
    ),
  );
}

export async function getFollowUpDashboardStats(
  supabase: SupabaseServer,
  params: {
    ctx: SubscriberContext;
    userId: string;
  },
): Promise<FollowUpDashboardStats> {
  const scope = resolveFollowUpScope(params.ctx, params.userId);

  let query = supabase
    .from("follow_up_tasks")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (scope.organizationId) {
    query = query.eq("organization_id", scope.organizationId);
  } else {
    query = query.eq("user_id", params.userId).is("organization_id", null);
  }

  const { count, error } = await query;
  if (error) {
    throw new Error("후속 조치 통계를 불러오지 못했습니다.");
  }

  return { pendingCount: count ?? 0 };
}

export async function updateFollowUpTask(
  supabase: SupabaseServer,
  params: {
    ctx: SubscriberContext;
    userId: string;
    taskId: string;
    status?: FollowUpTaskStatus;
    assignedUserId?: string | null;
  },
): Promise<FollowUpTask> {
  const scope = resolveFollowUpScope(params.ctx, params.userId);

  if (
    params.assignedUserId &&
    params.ctx.organization &&
    !params.ctx.organization.memberUserIds.includes(params.assignedUserId)
  ) {
    throw new FollowUpAccessError("사무소 소속 팀원에게만 배정할 수 있습니다.", 400);
  }

  if (params.assignedUserId && !params.ctx.organization) {
    throw new FollowUpAccessError("팀원 배정은 Team 플랜 사무소에서만 가능합니다.", 403);
  }

  let existingQuery = supabase
    .from("follow_up_tasks")
    .select("id")
    .eq("id", params.taskId);

  if (scope.organizationId) {
    existingQuery = existingQuery.eq("organization_id", scope.organizationId);
  } else {
    existingQuery = existingQuery.eq("user_id", params.userId).is("organization_id", null);
  }

  const { data: existing, error: existingError } = await existingQuery.maybeSingle();
  if (existingError || !existing) {
    throw new FollowUpAccessError("후속 조치를 찾을 수 없습니다.", 404);
  }

  const patch: {
    status?: FollowUpTaskStatus;
    assigned_user_id?: string | null;
  } = {};

  if (params.status) {
    patch.status = params.status;
  }
  if (params.assignedUserId !== undefined) {
    patch.assigned_user_id = params.assignedUserId;
  }

  const { data, error } = await supabase
    .from("follow_up_tasks")
    .update(patch)
    .eq("id", params.taskId)
    .select(
      "id, title, status, consultation_id, client_id, assigned_user_id, sort_order, created_at, completed_at, clients(name)",
    )
    .single();

  if (error || !data) {
    throw new Error("후속 조치 업데이트에 실패했습니다.");
  }

  const [task] = await attachAssigneeNames(supabase, [
    mapFollowUpTaskRow({
      ...data,
      clients: Array.isArray(data.clients) ? data.clients[0] ?? null : data.clients,
    }),
  ]);

  return task;
}
