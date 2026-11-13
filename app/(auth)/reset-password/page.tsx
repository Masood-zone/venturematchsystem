import { Suspense } from "react";
import type { Metadata } from "next";
import { RecoveryCard } from "../recovery-card";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Set new password", referrer: "no-referrer" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function ResetForm({ searchParams }: { searchParams: SearchParams }) {
  const { token, error } = await searchParams;
  return <ResetPasswordForm token={!error && typeof token === "string" ? token : undefined} />;
}

export default function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <RecoveryCard title="Set new password" icon="vpn_key">
      <Suspense fallback={<p role="status">Loading form…</p>}>
        <ResetForm searchParams={searchParams} />
      </Suspense>
    </RecoveryCard>
  );
}
