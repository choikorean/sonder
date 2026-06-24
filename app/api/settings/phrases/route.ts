import { type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { listSavedPhrases } from "@/lib/saved-phrases";
import { getSubscriberContext } from "@/lib/subscriber-context";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  savedPhraseSchema,
  firstZodErrorMessage,
} from "@/lib/validators";

export async function GET() {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const ctx = await getSubscriberContext(supabase);
  const phrases = await listSavedPhrases(supabase, ctx.capabilities);
  return successResponse({
    phrases,
    canUsePersonal: ctx.capabilities.savedPhrases,
    canUseOffice: ctx.capabilities.officeSharedPhrases,
  });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const ctx = await getSubscriberContext(supabase);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않습니다.", 400);
  }

  const parsed = savedPhraseSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(firstZodErrorMessage(parsed.error), 400);
  }

  const { label, content, scope } = parsed.data;

  if (scope === "personal" && !ctx.capabilities.savedPhrases) {
    return errorResponse(
      "자주 쓰는 문구 저장은 Pro 이상 요금제에서 이용할 수 있습니다.",
      403,
    );
  }
  if (scope === "office" && !ctx.capabilities.officeSharedPhrases) {
    return errorResponse(
      "사무소 공통 템플릿은 Team 요금제에서 이용할 수 있습니다.",
      403,
    );
  }

  const { data, error } = await supabase
    .from("saved_phrases")
    .insert({
      user_id: user.id,
      label,
      content,
      scope,
    })
    .select("id, label, content, scope, created_at")
    .single();

  if (error) {
    return errorResponse("문구 저장에 실패했습니다.", 500);
  }

  return successResponse({
    id: data.id,
    label: data.label,
    content: data.content,
    scope: data.scope,
    createdAt: data.created_at,
  });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return errorResponse("로그인이 필요합니다.", 401);
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return errorResponse("삭제할 문구를 지정해 주세요.", 400);
  }

  const { error } = await supabase
    .from("saved_phrases")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return errorResponse("문구 삭제에 실패했습니다.", 500);
  }

  return successResponse({ deleted: true });
}
