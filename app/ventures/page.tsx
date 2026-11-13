import { Suspense } from "react";import Link from "next/link";import { receivedInvitations } from "@/services/ventures/recruitment";import { trialList } from "@/services/ventures/trials";import { linkClass, panelClass } from "@/components/ventures/workspace-styles";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/services/auth/session";
import { ApplicationCard } from "@/components/ventures/application-actions";
import { myApplications } from "@/services/ventures/applications";
import { myVentures } from "@/services/ventures/dashboard";
import StudentShell from "@/components/onboarding/student-shell";
import { DashboardEmpty, DashboardHeading, SetupReminder } from "@/components/ventures/dashboard-parts";
import MyVentureCard from "@/components/ventures/my-venture-card";
import DashboardLoading from "@/components/ventures/dashboard-loading";

export default function MyVenturesPage() {
  return <Suspense fallback={<DashboardLoading />}><MyVentures /></Suspense>;
}

async function MyVentures() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "student") redirect("/");
  const userId = session.user.id;
  const [ventures, profile, applications, invitations, trials] = await Promise.all([
    myVentures(userId),
    db.student_profile.findUnique({ where: { userId }, select: { onboardingCompleted: true, onboardingVentureId: true } }),
    myApplications(userId),    receivedInvitations(userId),    trialList(userId),
  ]);
  const groups = [
    { title: "Owned ventures", rows: ventures.filter((venture) => venture.ownerId === userId && venture.status !== "DRAFT"), empty: "No published ventures yet", description: "Your ventures will appear here after you publish them. Private ideas stay in Saved drafts." },
    { title: "Joined ventures", rows: ventures.filter((venture) => venture.ownerId !== userId), empty: "You haven’t joined a venture yet", description: "Explore opportunities to find ideas that could use your skills.", explore: true },
    { title: "Saved drafts", rows: ventures.filter((venture) => venture.ownerId === userId && venture.status === "DRAFT"), empty: "No saved drafts", description: "Ideas saved during onboarding appear here. They stay private until you explicitly publish them." },
  ];
  return <StudentShell><main id="main-content" className="mx-auto w-full max-w-7xl flex-1 space-y-9 px-4 py-8 sm:px-8 sm:py-12">
    {!profile?.onboardingCompleted && <SetupReminder />}
    <DashboardHeading eyebrow="Your venture workspace" title="My ventures">Keep track of ventures you own, teams you’ve joined, and ideas you’re preparing to share.</DashboardHeading>    {profile?.onboardingCompleted && <Link href="/ventures/new" className="primary-link min-h-12 px-5 py-3">Create venture</Link>}    <div className="grid gap-4 md:grid-cols-2">      <section className={panelClass}>        <h2 className="text-xl font-semibold text-primary">Received invitations</h2>        {invitations.length ? <ul>{invitations.map((invitation) => <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 border-b last:border-0">          <Link href={`/ventures/invitations/${invitation.id}`} className={linkClass}>{invitation.venture.name}</Link>          <span className="text-sm capitalize text-muted-foreground">{invitation.unread ? "New message" : invitation.status.toLowerCase().replaceAll("_", " ")}</span>        </li>)}</ul> : <p>No venture invitations yet.</p>}      </section>      <section className={panelClass}>        <h2 className="text-xl font-semibold text-primary">Group trials</h2>        {trials.length ? <ul>{trials.map((trial) => <li key={trial.id} className="flex flex-wrap items-center justify-between gap-2 border-b last:border-0">          <Link href={`/ventures/trials/${trial.id}`} className={linkClass}>{trial.name} · {trial.objective}</Link>          <span className="text-sm capitalize text-muted-foreground">{trial.phase.toLowerCase()}</span>        </li>)}</ul> : <p>No group trials yet.</p>}      </section>    </div>
    <section aria-labelledby="my-applications-heading" className="space-y-4"><h2 id="my-applications-heading" className="text-xl font-semibold text-primary">My applications</h2>{applications.length ? <div className="grid items-start gap-4 md:grid-cols-2">{applications.map((application) => <ApplicationCard key={`${application.id}-${application.status}`} application={application} />)}</div> : <DashboardEmpty title="No applications yet" explore>Apply from a venture’s details to introduce yourself to its owner.</DashboardEmpty>}</section>
    {groups.map((group, index) => <section key={group.title} aria-labelledby={`venture-group-${index}`} className="space-y-4">
      <h2 id={`venture-group-${index}`} className="flex items-center gap-3 text-xl font-semibold text-primary">{group.title}<span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">{group.rows.length}</span></h2>
      {group.rows.length ? <div className="space-y-4">{group.rows.map((venture) => <MyVentureCard key={venture.id} venture={venture} owned={venture.ownerId === userId} onboardingIdea={venture.id === profile?.onboardingVentureId} />)}</div> : <DashboardEmpty title={group.empty} explore={group.explore}>{group.description}</DashboardEmpty>}
    </section>)}
  </main></StudentShell>;
}
