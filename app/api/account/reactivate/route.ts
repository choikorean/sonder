import {
  AccountReactivateError,
  reactivateWithdrawnAccount,
} from "@/lib/account/reactivate-service";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  accountReactivateSchema,
  firstZodErrorMessage,
} from "@/lib/validators";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = accountReactivateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  try {
    const result = await reactivateWithdrawnAccount(parsed.data);
    return successResponse({
      userId: result.userId,
      message: "계정이 복구되었습니다. 로그인해 주세요.",
    });
  } catch (error) {
    if (error instanceof AccountReactivateError) {
      return errorResponse(error.message, error.status);
    }

    return errorResponse("계정 복구에 실패했습니다.", 500);
  }
}
