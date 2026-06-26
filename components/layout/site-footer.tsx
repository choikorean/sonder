import Link from "next/link";

import { COMPANY, EXTERNAL_LINKS } from "@/lib/company";
import { cn } from "@/lib/utils";

type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={cn("border-t border-border", className)}>
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link
            href="/terms"
            className="text-foreground underline-offset-4 hover:underline"
          >
            이용약관
          </Link>
          <Link
            href="/privacy"
            className="text-foreground underline-offset-4 hover:underline"
          >
            개인정보처리방침
          </Link>
        </div>

        <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          <p className="text-sm font-semibold text-foreground">
            {COMPANY.serviceName}
          </p>
          <p>상호: {COMPANY.name}</p>
          <p>대표자: {COMPANY.representative}</p>
          <p>주소: {COMPANY.address}</p>
          <p>사업자등록번호: {COMPANY.businessRegistrationNumber}</p>
          <p>통신판매업신고번호: {COMPANY.mailOrderReportNumber}</p>
          <p>
            호스팅:{" "}
            <a
              href={EXTERNAL_LINKS.vercel}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Vercel
            </a>
          </p>
          <p>
            결제:{" "}
            <a
              href={EXTERNAL_LINKS.nicepay}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              나이스페이먼츠
            </a>
          </p>
          <p>
            문의:{" "}
            <a
              href={`mailto:${COMPANY.contactEmail}`}
              className="underline-offset-4 hover:underline"
            >
              {COMPANY.contactEmail}
            </a>
          </p>
          <p className="pt-2">
            본 서비스는 세법 판단을 제공하지 않습니다.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Copyright {COMPANY.copyrightYear} {COMPANY.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
