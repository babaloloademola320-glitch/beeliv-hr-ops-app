import type { Metadata } from "next";
import { Suspense } from "react";
import { SetupBody } from "@/components/client/setup/SetupBody";

export const metadata: Metadata = { title: "Account setup" };

export default function ClientSetupPage() {
  // SetupBody reads ?step= (from the Overview checklist links).
  return (
    <Suspense fallback={null}>
      <SetupBody />
    </Suspense>
  );
}
