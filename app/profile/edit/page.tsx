import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/services/auth/session";
import { loadOnboarding } from "@/services/onboarding/service";
import StudentShell from "@/components/onboarding/student-shell";
import ProfileEditor from "./profile-editor";

export default function ProfileEditPage() {
  return <Suspense fallback={<main id="main-content" className="p-8" role="status">Loading your profile…</main>}><Profile /></Suspense>;
}
async function Profile() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "student") redirect("/");
  const initial = await loadOnboarding(session.user.id);
  if (!initial.completed) redirect("/onboarding");
  return <StudentShell><main id="main-content" className="mx-auto w-full max-w-4xl flex-1 space-y-7 px-4 py-10 sm:px-8">
    <div><p className="text-xs font-semibold uppercase tracking-wider text-functional-teal">Your student profile</p><h1 className="mt-3 text-3xl font-bold text-primary">Make room for your next team</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">Keep your skills, interests and availability up to date. These help venture owners understand what you can bring.</p></div>
    <ProfileEditor key={session.user.id} initial={initial} />
  </main></StudentShell>;
}
