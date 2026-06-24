export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "이미 가입된 이메일입니다.";
  }
  if (m.includes("password should be at least")) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  if (m.includes("email not confirmed")) {
    return "이메일 인증이 필요합니다. 메일함을 확인해 주세요.";
  }
  if (m.includes("unable to validate email")) {
    return "이메일 형식이 올바르지 않습니다.";
  }
  if (m.includes("rate limit") || m.includes("only request this once")) {
    return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (m.includes("same as the old password")) {
    return "이전 비밀번호와 다른 비밀번호를 입력해 주세요.";
  }
  if (m.includes("database error querying schema")) {
    return "로그인 처리 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

/** Supabase AuthApiError 등 다양한 throw 형태에서 메시지 추출 */
export function getAuthErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

export const AUTH_CALLBACK_ERROR_MESSAGE =
  "인증 링크가 만료되었거나 올바르지 않습니다. 비밀번호 재설정을 다시 요청해 주세요.";
