import { type NextRequest } from "next/server";

import { successResponse, errorResponse } from "@/lib/api-response";
import { createServiceClient } from "@/lib/supabase/service";
import { recordBillingEvent } from "@/lib/billing/subscription-service";

/** NicePay 결제통보 수신 (server-side 전용) */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const payload: Record<string, string> = {};
    form.forEach((value, key) => {
      payload[key] = String(value);
    });

    const moid = payload.Moid ?? payload.MOID;
    if (!moid) {
      return errorResponse("유효하지 않은 통보입니다.", 400);
    }

    const supabase = createServiceClient();
    const { data: payment } = await supabase
      .from("payments")
      .select("user_id")
      .eq("moid", moid)
      .maybeSingle();

    if (payment?.user_id) {
      await recordBillingEvent(supabase, payment.user_id, "nicepay_webhook", payload);
    }

    return successResponse({ received: true });
  } catch {
    return errorResponse("결제통보 처리에 실패했습니다.", 500);
  }
}
