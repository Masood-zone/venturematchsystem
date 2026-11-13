import { Suspense } from "react";
import { entryContext, entryHref } from "@/lib/student-entry";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/services/auth/session";
import OnboardingWizard from "./wizard";

export default function OnboardingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense
      fallback={
        <main id="main-content" className="p-8" role="status">
          Loading your setup…
        </main>
      }
    >
      <StudentOnboarding searchParams={searchParams} />
    </Suspense>
  );
}
async function StudentOnboarding({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const context = entryContext({ get: (name) => { const value = params[name]; return Array.isArray(value) ? value[0] : value ?? null; } });
  const session = await getCurrentSession();
  if (!session) redirect(entryHref("/login", context));
  if (session.user.role !== "student") redirect("/");
  return <OnboardingWizard name={session.user.name} userId={session.user.id} context={context} />;
}
