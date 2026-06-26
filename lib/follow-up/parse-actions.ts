const EMPTY_MARKERS = new Set(["해당 없음", "없음", "n/a", "na"]);

function normalizeActionLine(line: string): string {
  return line
    .replace(/^[-•*]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}

export function parseNextActions(text: string | null | undefined): string[] {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) {
    return [];
  }

  if (EMPTY_MARKERS.has(trimmed.toLowerCase())) {
    return [];
  }

  const lines = trimmed
    .split(/\n+/)
    .map((line) => normalizeActionLine(line))
    .filter(Boolean);

  const items = lines.filter(
    (line) => !EMPTY_MARKERS.has(line.toLowerCase()),
  );

  if (items.length > 0) {
    return items;
  }

  return [trimmed];
}
