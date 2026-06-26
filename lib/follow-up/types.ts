export type FollowUpTaskStatus = "pending" | "done";

export type FollowUpTask = {
  id: string;
  title: string;
  status: FollowUpTaskStatus;
  consultationId: string | null;
  clientId: string | null;
  clientName: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  sortOrder: number;
  createdAt: string;
  completedAt: string | null;
};

export type FollowUpDashboardStats = {
  pendingCount: number;
};
