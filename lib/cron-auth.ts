import { type NextRequest } from "next/server";

/** Vercel Cron(`CRON_SECRET`) 및 수동 호출(`TAX_SCHEDULE_CRON_SECRET`) 토큰 검증 */
export function isAuthorizedCronSecret(
  request: NextRequest,
  envKeys: string[],
): boolean {
  const secrets = envKeys
    .map((key) => process.env[key])
    .filter((value): value is string => Boolean(value));

  if (secrets.length === 0) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice("Bearer ".length);
  return secrets.includes(token);
}
