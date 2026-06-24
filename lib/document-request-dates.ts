const KST = "Asia/Seoul";

const dateLabelFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KST,
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

const kstPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: KST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function kstCalendarDate(now: Date, offsetDays = 0): Date {
  const [year, month, day] = kstPartsFormatter
    .format(now)
    .split("-")
    .map(Number);
  return new Date(Date.UTC(year, month - 1, day + offsetDays, 3, 0, 0));
}

/** 자료 요청문에 넣을 기준일·제출 기한(생성 시점 KST 기준) */
export function getDocumentRequestDates(
  now = new Date(),
  submissionDays = 14,
): {
  requestDate: string;
  submissionDeadline: string;
} {
  return {
    requestDate: dateLabelFormatter.format(kstCalendarDate(now)),
    submissionDeadline: dateLabelFormatter.format(
      kstCalendarDate(now, submissionDays),
    ),
  };
}
