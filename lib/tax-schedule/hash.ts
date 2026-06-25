import { createHash } from "node:crypto";

export function buildContentHash(
  eventDate: string,
  title: string,
  note: string | null,
): string {
  return createHash("sha256")
    .update(`${eventDate}|${title}|${note ?? ""}`)
    .digest("hex");
}
