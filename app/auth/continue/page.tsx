import { Suspense } from "react";
import { entryContext, entryHref, completedEntry } from "@/lib/student-entry";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/services/auth/session";
import { getStudentAccount } from "@/services/auth/student-account";
export default function ContinuePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <Suspense fallback={<main id="main-content" className="p-8" role="status">Opening your account…</main>}><Continue searchParams={searchParams} /></Suspense>;
}
async function Continue({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const context = entryContext({ get: (name) => { const value = params[name]; return Array.isArray(value) ? value[0] : value ?? null; } });
  const session = await getCurrentSession();
  if (!session) redirect(entryHref("/login", context));
  if (session.user.role !== "student") redirect("/");
  const { destination } = await getStudentAccount(session.user.id);
  return redirect(destination === "/onboarding" ? entryHref(destination, context) : completedEntry(context, destination));
}
