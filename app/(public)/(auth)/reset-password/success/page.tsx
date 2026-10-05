import type { Metadata } from "next";
import { ResetSuccessPanel } from "@/components/public/auth/ResetSuccessPanel";

// DERIVED FROM THE AUTH FRAME: no wireframe board exists for this screen.
export const metadata: Metadata = {
  title: "Password reset",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ResetSuccessPage() {
  return <ResetSuccessPanel />;
}
