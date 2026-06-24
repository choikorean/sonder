import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyFormatActions } from "@/components/copy-format-actions";
import { ReviewDisclaimer } from "@/components/review-disclaimer";
import { toPlainClientText } from "@/lib/plain-text";

export function GeneratedOutput({
  title = "생성 결과",
  content,
  copyFormats = false,
  emailSubject,
}: {
  title?: string;
  content: string;
  copyFormats?: boolean;
  emailSubject?: string;
}) {
  const plainContent = toPlainClientText(content);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <CopyFormatActions
            text={plainContent}
            copyFormats={copyFormats}
            emailSubject={emailSubject}
          />
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
