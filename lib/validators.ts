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
  memo: z
    .string()
    .max(1000, "특이사항은 1000자 이내로 입력해 주세요.")
    .nullish(),
});

export type RequestGenerateInput = z.infer<typeof requestGenerateSchema>;
export type ConsultationSummaryInput = z.infer<typeof consultationSummarySchema>;
export type ReportExplanationInput = z.infer<typeof reportExplanationSchema>;

/** ZodError에서 사용자에게 보여줄 첫 번째 한국어 메시지를 추출합니다. */
export function firstZodErrorMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
}
