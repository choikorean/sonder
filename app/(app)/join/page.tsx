import { Suspense } from "react";

import JoinOrganizationPage from "./join-client";

export const metadata = {
  title: "사무소 초대",
};

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-muted-foreground">불러오는 중...</div>
      }
    >
      <JoinOrganizationPage />
    </Suspense>
  );
}
