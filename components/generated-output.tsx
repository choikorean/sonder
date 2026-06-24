import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { ReviewDisclaimer } from "@/components/review-disclaimer";
import { toPlainClientText } from "@/lib/plain-text";

export function GeneratedOutput({
  title = "생성 결과",
  content,
}: {
  title?: string;
  content: string;
}) {
  const plainContent = toPlainClientText(content);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <CopyButton text={plainContent} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {plainContent}
        </div>
        <ReviewDisclaimer />
      </CardContent>
    </Card>
  );
}
