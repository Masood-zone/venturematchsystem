import { Suspense } from "react";
import { entryContext, entryHref, completedEntry } from "@/lib/student-entry";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/services/auth/session";
import { db } from "@/lib/db";
import { studentDestination } from "@/lib/student-destination";
export default function ContinuePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <Suspense fallback={<main id="main-content" className="p-8" role="status">Opening your account…</main>}><Continue searchParams={searchParams} /></Suspense>;
}
async function Continue({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const context = entryContext({ get: (name) => { const value = params[name]; return Array.isArray(value) ? value[0] : value ?? null; } });
  const session = await getCurrentSession();
  if (!session) redirect(entryHref("/login", context));
  if (session.user.role !== "student") redirect("/");
  const profile = await db.student_profile.findUnique({ where: { userId: session.user.id }, select: { onboardingCompleted: true, onboardingGoal: true } });
  return redirect(!profile?.onboardingCompleted ? entryHref("/onboarding", context) : completedEntry(context, studentDestination(profile)));
}
