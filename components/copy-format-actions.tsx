"use client";

import { CopyButton } from "@/components/copy-button";
import { formatForEmail, formatForKakao } from "@/lib/copy-formats";

export function CopyFormatActions({
  text,
  copyFormats = false,
  emailSubject = "안내드립니다",
}: {
  text: string;
  copyFormats?: boolean;
  emailSubject?: string;
}) {
  if (!copyFormats) {
    return <CopyButton text={text} />;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <CopyButton text={text} label="복사" />
      <CopyButton text={formatForKakao(text)} label="카톡용" />
      <CopyButton
        text={formatForEmail(text, emailSubject)}
        label="이메일용"
      />
    </div>
  );
}
