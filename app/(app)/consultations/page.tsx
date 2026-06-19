import { ConsultationForm } from "@/components/forms/consultation-form";

export const metadata = {
  title: "상담 요약",
};

export default function ConsultationsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">상담 요약</h1>
        <p className="text-sm text-muted-foreground">
          상담 메모나 녹음 파일을 입력하면 내부 요약, 고객 전달용 요약, 필요 자료,
          후속 조치를 정리해 드립니다.
        </p>
      </div>
      <ConsultationForm />
    </div>
  );
}
