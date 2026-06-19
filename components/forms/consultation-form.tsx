"use client";

import { useState } from "react";

import { LoadingButton } from "@/components/loading-button";
import { CopyButton } from "@/components/copy-button";
import { ReviewDisclaimer } from "@/components/review-disclaimer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SummaryData = {
  transcript: string | null;
  summary: string;
  clientSummary: string;
  requiredDocuments: string;
  nextActions: string;
};

type ApiResult =
  | { success: true; data: SummaryData & { id: string } }
  | { success: false; error: string };

function OutputSection({ title, value }: { title: string; value: string }) {
  const content = value.trim();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {content && (
          <CardAction>
            <CopyButton text={content} />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {content ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">해당 없음</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ConsultationForm() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SummaryData | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!file && text.trim().length < 10) {
      setError("상담 메모를 10자 이상 입력하거나 오디오 파일을 첨부해 주세요.");
      return;
    }

    setLoading(true);
    setData(null);

    try {
      let res: Response;
      if (file) {
        const formData = new FormData();
        formData.append("audio", file);
        if (text.trim()) formData.append("text", text.trim());
        res = await fetch("/api/consultation-summary", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/consultation-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        });
      }

      const json: ApiResult = await res.json();
      if (!json.success) {
        setError(json.error);
      } else {
        setData(json.data);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>상담 내용 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">상담 메모</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="상담 내용을 입력하세요. (오디오 파일을 첨부하면 음성 인식 후 요약합니다)"
                rows={8}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audio">오디오 파일 (선택)</Label>
              <Input
                id="audio"
                type="file"
                accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/webm,.mp3,.m4a,.wav,.webm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                mp3, m4a, wav, webm · 최대 25MB
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <LoadingButton type="submit" loading={loading} size="lg">
              {loading ? "분석 중..." : "요약하기"}
            </LoadingButton>
          </form>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-4">
          {data.transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">음성 인식 결과</CardTitle>
                <CardAction>
                  <CopyButton text={data.transcript} />
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {data.transcript}
                </p>
              </CardContent>
            </Card>
          )}

          <OutputSection title="내부 요약" value={data.summary} />
          <OutputSection title="고객 전달용 요약" value={data.clientSummary} />
          <OutputSection title="필요 자료" value={data.requiredDocuments} />
          <OutputSection title="후속 조치" value={data.nextActions} />

          <ReviewDisclaimer />
        </div>
      )}
    </div>
  );
}
