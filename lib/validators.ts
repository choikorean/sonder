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

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "고객명(상호)을 입력해 주세요.")
    .max(100, "고객명은 100자 이내로 입력해 주세요."),
  contactName: z
    .string()
    .trim()
    .max(50, "담당자명은 50자 이내로 입력해 주세요.")
    .nullish(),
  businessType: z.enum(BUSINESS_TYPES, { error: "사업 유형을 선택해 주세요." }).nullish(),
  phone: z
    .string()
    .trim()
    .max(30, "연락처는 30자 이내로 입력해 주세요.")
    .nullish(),
  email: z
    .string()
    .trim()
    .max(200, "이메일은 200자 이내로 입력해 주세요.")
    .nullish()
    .refine(
      (value) => !value || z.string().email().safeParse(value).success,
      "이메일 형식이 올바르지 않습니다.",
    ),
  memo: z
    .string()
    .trim()
    .max(1000, "메모는 1,000자 이내로 입력해 주세요.")
    .nullish(),
});

export const clientUpdateSchema = clientSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;

const optionalClientIdSchema = z
  .string()
  .uuid("고객 정보가 올바르지 않습니다.")
  .nullish();

export const requestGenerateSchema = z.object({
  taxType: z.enum(TAX_TYPES, { error: "세목을 선택해 주세요." }),
  businessType: z.enum(BUSINESS_TYPES, { error: "사업 유형을 선택해 주세요." }),
  memo: z
    .string()
    .max(1000, "특이사항은 1000자 이내로 입력해 주세요.")
    .nullish(),
  clientId: optionalClientIdSchema,
  includeDocumentRationale: z.boolean().optional(),
});

export const documentExplanationSchema = z.object({
  taxType: z.enum(TAX_TYPES, { error: "세목을 선택해 주세요." }),
  businessType: z.enum(BUSINESS_TYPES).optional(),
  documentItems: z.union([
    z.array(z.string().trim().min(1)).min(1, "자료 항목을 1개 이상 입력해 주세요."),
    z
      .string()
      .trim()
      .min(1, "자료 항목을 입력해 주세요.")
      .max(2000, "자료 항목은 2000자 이내로 입력해 주세요."),
  ]),
  customerQuestion: z
    .string()
    .trim()
    .max(500, "고객 질문은 500자 이내로 입력해 주세요.")
    .nullish(),
  memo: z
    .string()
    .max(1000, "특이사항은 1000자 이내로 입력해 주세요.")
    .nullish(),
  clientId: optionalClientIdSchema,
});

export const consultationSummarySchema = z.object({
  text: z
    .string({ error: "상담 내용을 입력해 주세요." })
    .trim()
    .min(10, "상담 내용을 10자 이상 입력해 주세요.")
    .max(20000, "상담 내용은 20,000자 이내로 입력해 주세요."),
  clientId: optionalClientIdSchema,
});

export const consultationClientIdSchema = z.object({
  clientId: optionalClientIdSchema,
});

export const dueDateSuggestQuerySchema = z.object({
  taxType: z.enum(TAX_TYPES, { error: "세목을 선택해 주세요." }),
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
  clientId: optionalClientIdSchema,
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

export const orgInviteSchema = z.object({
  email: z
    .string()
    .trim()
    .email("올바른 이메일 형식이 아닙니다.")
    .max(200, "이메일은 200자 이내로 입력해 주세요."),
});

export const orgInviteAcceptSchema = z.object({
  token: z
    .string()
    .trim()
    .min(10, "초대 토큰이 올바르지 않습니다."),
});

export type OrgInviteInput = z.infer<typeof orgInviteSchema>;
export type OrgInviteAcceptInput = z.infer<typeof orgInviteAcceptSchema>;

export const taxScheduleQuerySchema = z.object({
  year: z.coerce
    .number()
    .int("연도는 정수여야 합니다.")
    .min(2000, "연도가 올바르지 않습니다.")
    .max(2100, "연도가 올바르지 않습니다."),
  month: z.coerce
    .number()
    .int("월은 정수여야 합니다.")
    .min(1, "월은 1~12 사이여야 합니다.")
    .max(12, "월은 1~12 사이여야 합니다."),
  taxCategory: z.enum(TAX_TYPES).optional(),
});

export type TaxScheduleQueryInput = z.infer<typeof taxScheduleQuerySchema>;

const accountEmailSchema = z
  .string()
  .trim()
  .min(1, "이메일을 입력해 주세요.")
  .email("이메일 형식이 올바르지 않습니다.");

const accountPasswordSchema = z
  .string()
  .min(6, "비밀번호는 6자 이상이어야 합니다.");

export const accountWithdrawnStatusSchema = z.object({
  email: accountEmailSchema,
});

export const accountReactivateSchema = z.object({
  email: accountEmailSchema,
  password: accountPasswordSchema,
  name: z
    .string()
    .trim()
    .min(1, "이름을 입력해 주세요.")
    .max(50, "이름은 50자 이내로 입력해 주세요."),
});

export type AccountWithdrawnStatusInput = z.infer<
  typeof accountWithdrawnStatusSchema
>;
export type AccountReactivateInput = z.infer<typeof accountReactivateSchema>;

const CAMPAIGN_ITEM_STATUSES = [
  "not_requested",
  "requested",
  "partial",
  "completed",
  "rerequest_needed",
] as const;

export const campaignCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, "제목은 200자 이내로 입력해 주세요.")
    .optional(),
  taxType: z.enum(TAX_TYPES).optional(),
  memo: z
    .string()
    .max(1000, "특이사항은 1000자 이내로 입력해 주세요.")
    .nullish(),
  seasonPresetId: z.string().trim().max(100).nullish(),
  submissionDeadlineLabel: z.string().trim().max(100).nullish(),
  clientIds: z
    .array(z.string().uuid("고객 정보가 올바르지 않습니다."))
    .min(1, "캠페인에 포함할 고객을 1명 이상 선택해 주세요."),
});

export const campaignAddClientsSchema = z.object({
  clientIds: z
    .array(z.string().uuid("고객 정보가 올바르지 않습니다."))
    .min(1, "추가할 고객을 선택해 주세요."),
});

export const campaignItemUpdateSchema = z.object({
  status: z.enum(CAMPAIGN_ITEM_STATUSES, {
    error: "상태 값이 올바르지 않습니다.",
  }),
  missingItems: z
    .string()
    .max(2000, "미제출 자료는 2000자 이내로 입력해 주세요.")
    .nullish(),
});

export const campaignGenerateSchema = z.object({
  itemIds: z
    .array(z.string().uuid("캠페인 항목이 올바르지 않습니다."))
    .optional(),
  onlyNotRequested: z.boolean().optional(),
});

export const requestRerequestSchema = z.object({
  taxType: z.enum(TAX_TYPES, { error: "세목을 선택해 주세요." }),
  businessType: z.enum(BUSINESS_TYPES).optional(),
  missingItems: z.union([
    z.array(z.string().trim().min(1)).min(1),
    z.string().trim().min(1),
  ]),
  memo: z
    .string()
    .max(1000, "특이사항은 1000자 이내로 입력해 주세요.")
    .nullish(),
  clientId: optionalClientIdSchema,
  campaignItemId: z.string().uuid().nullish(),
  submissionDeadlineLabel: z.string().trim().max(100).nullish(),
});

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export type CampaignGenerateInput = z.infer<typeof campaignGenerateSchema>;
export type RequestRerequestInput = z.infer<typeof requestRerequestSchema>;

export const followUpTaskListQuerySchema = z.object({
  status: z.enum(["pending", "done", "all"]).default("pending"),
});

export const followUpTaskUpdateSchema = z.object({
  status: z.enum(["pending", "done"]).optional(),
  assignedUserId: z
    .string()
    .uuid("담당자 정보가 올바르지 않습니다.")
    .nullish(),
});

/** ZodError에서 사용자에게 보여줄 첫 번째 한국어 메시지를 추출합니다. */
export function firstZodErrorMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
}
