import {
  AccountReactivateError,
  getWithdrawnStatusByEmail,
} from "@/lib/account/reactivate-service";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  accountWithdrawnStatusSchema,
  firstZodErrorMessage,
} from "@/lib/validators";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = accountWithdrawnStatusSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  try {
    const status = await getWithdrawnStatusByEmail(parsed.data.email);

    return successResponse({
      canReactivate: status.kind === "can_reactivate",
      retentionExpired: status.kind === "retention_expired",
    });
  } catch (error) {
    if (error instanceof AccountReactivateError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("계정 상태를 확인하지 못했습니다.", 500);
  }
}
