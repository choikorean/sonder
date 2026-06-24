/**
 * 카카오톡·이메일 등 플레인 텍스트 환경용.
 * 마크다운 장식(** 등)을 제거해 붙여넣기 시 그대로 읽히게 합니다.
 */
export function toPlainClientText(text: string): string {
  let plain = text;

  plain = plain.replace(/\*\*\*(.+?)\*\*\*/g, "$1");
  plain = plain.replace(/\*\*(.+?)\*\*/g, "$1");
  plain = plain.replace(/\*(.+?)\*/g, "$1");
  plain = plain.replace(/___(.+?)___/g, "$1");
  plain = plain.replace(/__(.+?)__/g, "$1");
  plain = plain.replace(/~~(.+?)~~/g, "$1");
  plain = plain.replace(/`([^`\n]+)`/g, "$1");
  plain = plain.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  plain = plain.replace(/^#{1,6}\s+/gm, "");
  plain = plain.replace(/^[-*_]{3,}\s*$/gm, "");

  // 짝이 맞지 않아 남은 장식 문자 정리
  plain = plain.replace(/\*\*/g, "");
  plain = plain.replace(/__/g, "");

  return plain.trim();
}
