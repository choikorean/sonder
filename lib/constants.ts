export const TAX_TYPE_LABELS = {
  VAT: "부가가치세",
  INCOME_TAX: "종합소득세",
  CORPORATE_TAX: "법인세",
  WITHHOLDING_TAX: "원천세",
  YEAR_END_SETTLEMENT: "연말정산",
} as const;

export type TaxType = keyof typeof TAX_TYPE_LABELS;

export const BUSINESS_TYPE_LABELS = {
  SOLE: "개인사업자",
  CORPORATION: "법인",
  FREELANCER: "프리랜서",
  ECOMMERCE: "온라인 쇼핑몰",
  RESTAURANT: "음식점",
  SERVICE: "서비스업",
  ETC: "기타",
} as const;

export type BusinessType = keyof typeof BUSINESS_TYPE_LABELS;

export const FEATURE_LABELS = {
  request_generation: "자료 요청",
  consultation_summary: "상담 요약",
  report_explanation: "신고 결과 설명문",
} as const;

export type Feature = keyof typeof FEATURE_LABELS;

export const REVIEW_DISCLAIMER =
  "AI가 생성한 초안입니다. 고객 발송 전 세무사가 반드시 검토해야 합니다.";

export const STARTER_PLAN = {
  name: "Starter",
  priceKrw: 99000,
  limits: {
    request_generation: 500,
    consultation_summary: 100,
    report_explanation: 500,
  },
} as const;

export const AUDIO_MAX_BYTES = 26214400; // 25MB

export const AUDIO_ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/webm",
] as const;
