import { getAuthContext } from "@/lib/auth";
import {
  getPromptProfile,
  getSubscriberContext,
} from "@/lib/subscriber-context";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  profileUpdateSchema,
  firstZodErrorMessage,
} from "@/lib/validators";

export async function GET() {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const profile = await getPromptProfile(supabase);
  const ctx = await getSubscriberContext(supabase);
  return successResponse({
    ...profile,
    canEdit: ctx.capabilities.officeSignature,
  });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const ctx = await getSubscriberContext(supabase);
  if (!ctx.capabilities.officeSignature) {
    return errorResponse(
      "사무소 프로필 편집은 Pro 플랜 이상에서 이용할 수 있습니다.",
      403,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  const { name, officeName, phone } = parsed.data;
  const { error } = await supabase
    .from("profiles")
    .update({
      name: name?.trim() || null,
      office_name: officeName?.trim() || null,
      phone: phone?.trim() || null,
    })
    .eq("id", user.id);

  if (error) {
    return errorResponse("프로필 저장에 실패했습니다.", 500);
  }

  const profile = await getPromptProfile(supabase);
  return successResponse(profile);
}
