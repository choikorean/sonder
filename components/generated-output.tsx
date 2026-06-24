import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyFormatActions } from "@/components/copy-format-actions";
import { ReviewDisclaimer } from "@/components/review-disclaimer";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <CopyFormatActions
            text={content}
            copyFormats={copyFormats}
            emailSubject={emailSubject}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </div>
        <ReviewDisclaimer />
      </CardContent>
    </Card>
  );
}
