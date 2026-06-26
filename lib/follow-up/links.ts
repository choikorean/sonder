export function buildDocumentRequestLink(params: {
  clientId?: string | null;
  requiredDocuments?: string | null;
  consultationSummary?: string | null;
}): string {
  const search = new URLSearchParams();

  if (params.clientId) {
    search.set("clientId", params.clientId);
  }

  const memoParts: string[] = [];
  const documents = params.requiredDocuments?.trim();
  if (documents && documents !== "해당 없음") {
    memoParts.push(`추가로 요청할 자료:\n${documents}`);
  }

  const summary = params.consultationSummary?.trim();
  if (summary) {
    memoParts.push(`상담 요약 참고:\n${summary}`);
  }

  if (memoParts.length > 0) {
    search.set("memo", memoParts.join("\n\n"));
  }

  const query = search.toString();
  return query ? `/requests?${query}` : "/requests";
}
