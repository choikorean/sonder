import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { ReviewDisclaimer } from "@/components/review-disclaimer";

export function GeneratedOutput({
  title = "생성 결과",
  content,
}: {
  title?: string;
  content: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <CopyButton text={content} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
        <ReviewDisclaimer />
      </CardContent>
    </Card>
  );
}
