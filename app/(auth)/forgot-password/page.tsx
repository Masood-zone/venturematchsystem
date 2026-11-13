import type { Metadata } from "next";
import { RecoveryCard } from "../recovery-card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <RecoveryCard title="Reset your password" icon="lock_reset">
      <ForgotPasswordForm />
    </RecoveryCard>
  );
}
