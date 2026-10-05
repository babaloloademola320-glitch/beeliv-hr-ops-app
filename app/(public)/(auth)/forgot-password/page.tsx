import type { Metadata } from "next";
import { ForgotForm } from "@/components/public/auth/ForgotForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
