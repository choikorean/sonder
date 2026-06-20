import { type NextRequest, NextResponse } from "next/server";

import {
  completeBillkeyRegistration,
  getPaymentOrderByMoid,
} from "@/lib/billing/subscription-service";
import { createServiceClient } from "@/lib/supabase/service";
import { parseAuthCallback } from "@/lib/nicepay";

function redirectUrl(origin: string, params: Record<string, string>) {
  const url = new URL("/billing/complete", origin);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

async function readCallbackPayload(request: NextRequest) {
  if (request.method === "GET") {
    const data: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  }

  const form = await request.formData();
  const data: Record<string, string> = {};
  form.forEach((value, key) => {
    data[key] = String(value);
  });
  return data;
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

async function handleCallback(request: NextRequest) {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  try {
    const raw = await readCallbackPayload(request);
    const auth = parseAuthCallback(raw);

    if (auth.AuthResultCode !== "0000") {
      return NextResponse.redirect(
        redirectUrl(origin, {
          status: "failed",
          message: auth.AuthResultMsg || "카드 인증에 실패했습니다.",
        }),
      );
    }

    const supabase = createServiceClient();
    const order = await getPaymentOrderByMoid(supabase, auth.Moid ?? "");
    const orderId = auth.ReqReserved || order.id;

    const result = await completeBillkeyRegistration({
      userId: order.user_id,
      orderId,
      auth,
    });

    const params: Record<string, string> = {
      status: "success",
      orderId,
      checkoutType: result.checkoutType,
    };

    if (result.checkoutType === "subscription") {
      params.planId = result.planId;
      params.trialEndsAt = result.trialEndsAt;
      params.nextBillingAt = result.nextBillingAt;
      params.amount = String(result.amount);
    }

    return NextResponse.redirect(redirectUrl(origin, params));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "카드 등록 처리에 실패했습니다.";
    return NextResponse.redirect(
      redirectUrl(origin, {
        status: "failed",
        message,
      }),
    );
  }
}
