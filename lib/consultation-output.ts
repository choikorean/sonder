/** 상담 요약 API·DB 공통 필드 */
export type ConsultationFields = {
  summary: string;
  clientSummary: string;
  requiredDocuments: string;
  nextActions: string;
  nextGuidance: string;
};

export function toConsultationApiResponse(
  fields: ConsultationFields,
  fullConsultationOutput: boolean,
): ConsultationFields & { fullConsultationOutput: boolean } {
  if (fullConsultationOutput) {
    return { ...fields, fullConsultationOutput: true };
  }
  return {
    summary: fields.summary,
    nextActions: fields.nextActions,
    clientSummary: "",
    requiredDocuments: "",
    nextGuidance: "",
    fullConsultationOutput: false,
  };
}

export function toConsultationDbInsert(
  fields: ConsultationFields,
  fullConsultationOutput: boolean,
): {
  summary: string;
  client_summary: string;
  required_documents: string | null;
  next_actions: string | null;
  next_guidance: string | null;
} {
  if (fullConsultationOutput) {
    return {
      summary: fields.summary,
      client_summary: fields.clientSummary,
      required_documents: fields.requiredDocuments || null,
      next_actions: fields.nextActions || null,
      next_guidance: fields.nextGuidance || null,
    };
  }
  return {
    summary: fields.summary,
    client_summary: "",
    required_documents: null,
    next_actions: fields.nextActions || null,
    next_guidance: null,
  };
}
