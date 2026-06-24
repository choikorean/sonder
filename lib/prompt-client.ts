import type { BusinessType } from "@/lib/constants";

/** AI 프롬프트에 전달하는 고객 정보 (제공된 사실만) */
export type PromptClient = {
  name: string;
  contactName?: string | null;
  businessType?: BusinessType | null;
  memo?: string | null;
};
