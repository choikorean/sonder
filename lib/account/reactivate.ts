export type WithdrawnProfileSnapshot = {
  withdrawn_at: string | null;
  hard_delete_at: string | null;
};

export type WithdrawnAccountStatus =
  | { kind: "not_withdrawn" }
  | { kind: "can_reactivate" }
  | { kind: "retention_expired" };

export function normalizeAccountEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getWithdrawnAccountStatus(
  profile: WithdrawnProfileSnapshot | null | undefined,
  now = new Date(),
): WithdrawnAccountStatus {
  if (!profile?.withdrawn_at) {
    return { kind: "not_withdrawn" };
  }

  if (profile.hard_delete_at) {
    const hardDeleteAt = new Date(profile.hard_delete_at);
    if (hardDeleteAt.getTime() <= now.getTime()) {
      return { kind: "retention_expired" };
    }
  }

  return { kind: "can_reactivate" };
}

export function canReactivateWithdrawnAccount(
  profile: WithdrawnProfileSnapshot | null | undefined,
  now = new Date(),
): boolean {
  return getWithdrawnAccountStatus(profile, now).kind === "can_reactivate";
}
