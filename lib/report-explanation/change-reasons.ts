export const TAX_CHANGE_REASON_CHIPS = [
  "매출 증가",
  "매출 감소",
  "매입세액 공제 증가",
  "매입세액 공제 감소",
  "경비 증가",
  "경비 감소",
  "공제 항목 변경",
  "가산세 발생",
  "중간예납·기납부세액 반영",
] as const;

export type TaxChangeReasonChip = (typeof TAX_CHANGE_REASON_CHIPS)[number];

export function combineChangeReasons(
  selectedChips: string[],
  customReason?: string | null,
): string | undefined {
  const parts = [
    ...new Set(selectedChips.map((chip) => chip.trim()).filter(Boolean)),
  ];

  const custom = customReason?.trim();
  if (custom) {
    parts.push(custom);
  }

  return parts.length > 0 ? parts.join(", ") : undefined;
}
