import { z, ZodError } from "zod";

const TAX_TYPES = [
  "VAT",
  "INCOME_TAX",
  "CORPORATE_TAX",
  "WITHHOLDING_TAX",
  "YEAR_END_SETTLEMENT",
] as const;

const BUSINESS_TYPES = [
  "SOLE",
  "CORPORATION",
  "FREELANCER",
  "ECOMMERCE",
  "RESTAURANT",
  "SERVICE",
  "ETC",
] as const;

export const requestGenerateSchema = z.object({
  taxType: z.enum(TAX_TYPES, { error: "세목을 선택해 주세요." }),
  businessType: z.enum(BUSINESS_TYPES, { error: "사업 유형을 선택해 주세요." }),
  memo: z
    .string()
    .max(1000, "특이사항은 1000자 이내로 입력해 주세요.")
    .nullish(),
});

export const consultationSummarySchema = z.object({
  text: z
    .string({ error: "상담 내용을 입력해 주세요." })
    .trim()
    .min(10, "상담 내용을 10자 이상 입력해 주세요.")
    .max(20000, "상담 내용은 20,000자 이내로 입력해 주세요."),
});

export const reportExplanationSchema = z.object({
  taxType: z.enum(TAX_TYPES, { error: "세목을 선택해 주세요." }),
  currentTax: z.coerce
    .number({ error: "이번 신고 세액을 숫자로 입력해 주세요." })
    .nonnegative("0 이상의 금액을 입력해 주세요."),
  previousTax: z.coerce
    .number({ error: "이전 신고 세액을 숫자로 입력해 주세요." })
    .nonnegative("0 이상의 금액을 입력해 주세요.")
    .nullish(),
  changeReason: z
    .string()
    .max(500, "변동 사유는 500자 이내로 입력해 주세요.")
    .nullish(),
  dueDate: z
    .string()
    .max(100, "납부기한은 100자 이내로 입력해 주세요.")
    .nullish(),
  memo: z
    .string()
    .max(1000, "특이사항은 1000자 이내로 입력해 주세요.")
    .nullish(),
});

export const checkoutSchema = z.object({
  planId: z.enum(["starter", "pro", "team"], {
    error: "결제할 요금제를 선택해 주세요.",
  }),
  cycle: z.enum(["monthly", "yearly"], {
    error: "결제 주기를 선택해 주세요.",
  }),
});

export const billingPrepareSchema = checkoutSchema.extend({
  checkoutType: z.enum(["subscription", "change_card"]).default("subscription"),
  agreeRecurring: z.literal(true, {
    error: "매월 정기결제에 동의해 주세요.",
  }),
  agreeTrialCharge: z.literal(true, {
    error: "무료 체험 종료 후 자동 결제에 동의해 주세요.",
  }),
  agreeTerms: z.literal(true, {
    error: "이용약관 및 개인정보처리방침에 동의해 주세요.",
  }),
});

export const billingCancelSchema = z.object({
  reason: z
    .enum([
      "price",
      "low_usage",
      "missing_features",
      "other_service",
      "other",
    ])
    .optional(),
});

export type BillingPrepareInput = z.infer<typeof billingPrepareSchema>;
export type BillingCancelInput = z.infer<typeof billingCancelSchema>;

export type RequestGenerateInput = z.infer<typeof requestGenerateSchema>;
export type ConsultationSummaryInput = z.infer<typeof consultationSummarySchema>;
export type ReportExplanationInput = z.infer<typeof reportExplanationSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .max(50, "담당자명은 50자 이내로 입력해 주세요.")
    .nullish(),
  officeName: z
    .string()
    .max(100, "사무소명은 100자 이내로 입력해 주세요.")
    .nullish(),
  phone: z
    .string()
    .max(30, "연락처는 30자 이내로 입력해 주세요.")
    .nullish(),
});

export const savedPhraseSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "문구 이름을 입력해 주세요.")
    .max(50, "문구 이름은 50자 이내로 입력해 주세요."),
  content: z
    .string()
    .trim()
    .min(1, "문구 내용을 입력해 주세요.")
    .max(2000, "문구 내용은 2,000자 이내로 입력해 주세요."),
  scope: z.enum(["personal", "office"], {
    error: "문구 범위를 선택해 주세요.",
  }),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type SavedPhraseInput = z.infer<typeof savedPhraseSchema>;

/** ZodError에서 사용자에게 보여줄 첫 번째 한국어 메시지를 추출합니다. */
export function firstZodErrorMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
}
