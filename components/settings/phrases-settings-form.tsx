"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { LoadingButton } from "@/components/loading-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SavedPhrase = {
  id: string;
  label: string;
  content: string;
  scope: "personal" | "office";
  createdAt: string;
};

type ListResult =
  | {
      success: true;
      data: {
        phrases: SavedPhrase[];
        canUsePersonal: boolean;
        canUseOffice: boolean;
      };
    }
  | { success: false; error: string };

const selectClassName = cn(
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

export function PhrasesSettingsForm() {
  const [phrases, setPhrases] = useState<SavedPhrase[]>([]);
  const [canUsePersonal, setCanUsePersonal] = useState(false);
  const [canUseOffice, setCanUseOffice] = useState(false);
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [scope, setScope] = useState<"personal" | "office">("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPhrases() {
    const res = await fetch("/api/settings/phrases");
    const json: ListResult = await res.json();
    if (json.success) {
      setPhrases(json.data.phrases);
      setCanUsePersonal(json.data.canUsePersonal);
      setCanUseOffice(json.data.canUseOffice);
      if (!json.data.canUsePersonal && json.data.canUseOffice) {
        setScope("office");
      }
    }
  }

  useEffect(() => {
    void loadPhrases().finally(() => setLoading(false));
  }, []);

  const canAdd = scope === "personal" ? canUsePersonal : canUseOffice;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAdd) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/phrases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          content: content.trim(),
          scope,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }
      setLabel("");
      setContent("");
      await loadPhrases();
    } catch {
      setError("문구 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/settings/phrases?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error);
        return;
      }
      await loadPhrases();
    } catch {
      setError("문구 삭제 중 오류가 발생했습니다.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>자주 쓰는 문구</CardTitle>
        <p className="text-sm text-muted-foreground">
          최근 저장 문구를 최대 5개 불러와 AI가 맥락에 맞게 표현을 참고해
          자연스럽게 활용합니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <>
            {!canUsePersonal && !canUseOffice && (
              <p className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                문구 저장은 Pro 이상 요금제에서 이용할 수 있습니다. Team
                요금제에서는 사무소 공통 템플릿도 저장할 수 있습니다.
              </p>
            )}

            {canAdd && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phraseLabel">문구 이름</Label>
                    <Input
                      id="phraseLabel"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="예) 자료 제출 안내"
                      disabled={saving}
                    />
                  </div>
                  {canUseOffice && (
                    <div className="space-y-2">
                      <Label htmlFor="phraseScope">범위</Label>
                      <select
                        id="phraseScope"
                        className={selectClassName}
                        value={scope}
                        onChange={(e) =>
                          setScope(e.target.value as "personal" | "office")
                        }
                        disabled={saving || !canUsePersonal}
                      >
                        {canUsePersonal && (
                          <option value="personal">개인 문구</option>
                        )}
                        <option value="office">사무소 공통 템플릿</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phraseContent">문구 내용</Label>
                  <Textarea
                    id="phraseContent"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="생성 시 참고할 인사말·안내 문구를 입력하세요."
                    rows={4}
                    disabled={saving}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}

                <LoadingButton type="submit" loading={saving}>
                  {saving ? "저장 중..." : "문구 추가"}
                </LoadingButton>
              </form>
            )}

            {phrases.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">저장된 문구</p>
                {phrases.map((phrase) => (
                  <div
                    key={phrase.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {phrase.label}
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            {phrase.scope === "office"
                              ? "사무소 공통"
                              : "개인"}
                          </span>
                        </p>
                        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
                          {phrase.content}
                        </p>
                      </div>
                      {canAdd && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(phrase.id)}
                          aria-label="문구 삭제"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
