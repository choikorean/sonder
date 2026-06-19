import { ReportForm } from "@/components/forms/report-form";

export const metadata = {
  title: "신고 결과 설명문",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">신고 결과 설명문</h1>
        <p className="text-sm text-muted-foreground">
          신고 세액 정보를 입력하면 고객이 이해하기 쉬운 설명문을 생성합니다.
        </p>
      </div>
      <ReportForm />
    </div>
  );
}
