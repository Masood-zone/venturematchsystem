import { Suspense, type ReactNode } from "react";

import { notFound, redirect } from "next/navigation";

import Link from "next/link";

import { db } from "@/lib/db";

import { getCurrentSession } from "@/services/auth/session";

import { accessibleVenture } from "@/services/onboarding/discovery";

import { listVentureApplications, ownApplication } from "@/services/ventures/applications";

import StudentShell from "@/components/onboarding/student-shell";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";

import { ApplicationCard, ApplyPanel } from "@/components/ventures/application-actions";


import { ventureStageLabels, ventureStatusLabels } from "@/lib/venture-dashboard";

import { entryHref } from "@/lib/student-entry";

import type { ApplicationSnapshot } from "@/lib/venture-applications";



export default function VenturePage({ params }: { params: Promise<{ id: string }> }) {

  return <Suspense fallback={<main id="main-content" className="p-8" role="status">Loading venture…</main>}><Venture params={params} /></Suspense>;

}

function BriefSection({ icon, eyebrow, title, children }: { icon: string; eyebrow: string; title: string; children: ReactNode }) {

  return <section className="space-y-5 rounded-2xl border border-primary/5 bg-white p-6 sm:p-8">

    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-functional-teal"><MaterialSymbol icon={icon} className="text-lg" />{eyebrow}</p>

    <h2 className="text-xl font-bold text-primary sm:text-2xl">{title}</h2>{children}

  </section>;

}

async function Venture({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;

  const session = await getCurrentSession();

  if (!session) redirect(entryHref("/login", { ventureId: id, goal: "JOIN_TEAM" }));

  if (session.user.role !== "student") redirect("/");

  const venture = await accessibleVenture(id, session.user.id);

  if (!venture) notFound();

  const owned = venture.ownerId === session.user.id;

  const [sector, hours, memberCount, membership, profile, applications, application] = await Promise.all([

    venture.primarySectorId ? db.venture_sector.findUnique({ where: { id: venture.primarySectorId }, select: { name: true } }) : null,

    venture.weeklyHoursBand ? db.availability_option.findUnique({ where: { id: venture.weeklyHoursBand }, select: { label: true } }) : null,

    db.venture_member.count({ where: { ventureId: id, status: "ACTIVE" } }),

    owned ? null : db.venture_member.findUnique({ where: { ventureId_userId: { ventureId: id, userId: session.user.id } }, select: { status: true } }),

    owned ? null : db.student_profile.findUnique({ where: { userId: session.user.id }, select: {

      onboardingCompleted: true, contributionIntro: true, teamGoals: true,

      academic_profile: { select: { programme: true } }, student_availability: { select: { weeklyHoursBand: true } },

      student_capability: { select: { proficiency: true, capability: { select: { name: true } } } },

      student_venture_interest: { select: { venture_sector: { select: { name: true } } } },

    } }),

    owned ? listVentureApplications(session.user.id, id) : [],

    owned ? null : ownApplication(session.user.id, id),

  ]);

  const availability = profile?.student_availability?.weeklyHoursBand

    ? await db.availability_option.findUnique({ where: { id: profile.student_availability.weeklyHoursBand }, select: { label: true } }) : null;

  const snapshot: ApplicationSnapshot = {

    name: session.user.name, programme: profile?.academic_profile?.programme ?? null,

    skills: profile?.student_capability.map((skill) => ({ name: skill.capability.name, proficiency: skill.proficiency })) ?? [],

    interests: profile?.student_venture_interest.map((interest) => interest.venture_sector.name) ?? [],

    availability: availability?.label ?? null, contributionIntro: profile?.contributionIntro ?? "", teamGoals: profile?.teamGoals ?? "",

  };

  const draft = venture.status === "DRAFT";

  const pending = applications.filter((item) => item.status === "PENDING").length;

  return <StudentShell><main id="main-content" className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-8 sm:py-10">

    <Link href={owned ? "/ventures" : "/explore"} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-functional-teal"><MaterialSymbol icon="arrow_back" className="text-lg" />{owned ? "Back to My Ventures" : "Back to Explore"}</Link>

    <header className="relative overflow-hidden rounded-3xl border border-primary/5 bg-white p-6 sm:p-10">

      <div className="absolute inset-y-0 left-0 w-1.5 bg-functional-teal" aria-hidden="true" />

      <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-accent px-3 py-1.5 font-semibold text-functional-teal">{draft ? "Private draft · only visible to you" : ventureStatusLabels[venture.status]}</span><span className="rounded-full bg-secondary px-3 py-1.5 text-muted-foreground">{ventureStageLabels[venture.stage]}</span>{sector && <span className="rounded-full bg-secondary px-3 py-1.5 text-muted-foreground">{sector.name}</span>}</div>

      <h1 className="mt-5 max-w-4xl wrap-anywhere text-3xl font-bold tracking-tight text-primary sm:text-4xl">{venture.name || "Untitled idea"}</h1>

      {venture.shortPitch && <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">{venture.shortPitch}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><MaterialSymbol icon="person" className="text-xl text-functional-teal" />Created by {venture.user.name}</span>{hours && <span className="inline-flex items-center gap-2"><MaterialSymbol icon="schedule" className="text-xl text-functional-teal" />{hours.label} / week</span>}<span className="inline-flex items-center gap-2"><MaterialSymbol icon="group" className="text-xl text-functional-teal" />{memberCount} active {memberCount === 1 ? "member" : "members"}</span></div>

    </header>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">

      <div className="order-2 min-w-0 space-y-6 lg:order-1">

        <BriefSection icon="lightbulb" eyebrow="Venture context" title="The problem we’re solving"><p className="whitespace-pre-wrap break-words text-sm leading-8 text-muted-foreground">{venture.problem || "The owner has not added a problem statement yet."}</p></BriefSection>

        <BriefSection icon="groups" eyebrow="Who it’s for" title="The people this could help"><p className="whitespace-pre-wrap break-words text-sm leading-8 text-muted-foreground">{venture.targetUsers || "The owner has not described the target audience yet."}</p></BriefSection>

        <BriefSection icon="handshake" eyebrow="Open collaboration" title="How you could contribute"><p className="whitespace-pre-wrap break-words text-sm leading-8 text-muted-foreground">{venture.recruitmentContribution || "The owner has not added a contribution brief yet."}</p><div className="rounded-xl bg-secondary/60 p-5"><h3 className="mb-4 text-sm font-semibold text-primary">Skills the venture is looking for</h3>{venture.venture_capability_requirement.length ? <ul className="flex flex-wrap gap-2">{venture.venture_capability_requirement.map((row) => <li key={row.capability.id} className="onboarding-chip bg-white">{row.capability.name}</li>)}</ul> : <p className="text-sm text-muted-foreground">No skills have been specified yet.</p>}</div></BriefSection>

        {owned && <section id="applications" aria-labelledby="applications-heading" className="scroll-mt-28 space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="applications-heading" className="text-2xl font-bold text-primary">Applications</h2><span className="text-sm text-muted-foreground">{pending} awaiting review</span></div><p className="text-sm leading-7 text-muted-foreground">Review each student’s submitted profile and introduction. Approval adds them to your team.</p>{applications.length ? applications.map((item) => <ApplicationCard key={`${item.id}-${item.status}`} application={item} owner />) : <p className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">No applications yet. Applications to your published venture will appear here.</p>}</section>}

      </div>

      <aside className="order-1 min-w-0 space-y-5 lg:order-2 lg:sticky lg:top-28">

        <section className="space-y-5 rounded-2xl border border-primary/5 bg-white p-6 sm:p-7" aria-labelledby="join-heading"><p className="text-xs font-semibold uppercase tracking-wider text-functional-teal">{owned ? "Your venture" : "Your next step"}</p><h2 id="join-heading" className="text-xl font-bold text-primary">{owned ? "Manage your venture" : membership?.status === "ACTIVE" ? "You’re on the team" : "Bring your skills to this idea"}</h2>
          {owned && venture.status === "ACTIVE" && <nav aria-label="Manage venture" className="flex flex-wrap gap-4">
            <Link href={`/ventures/${venture.id}/edit`} className="inline-flex min-h-11 items-center font-semibold underline">Edit brief</Link>
            <Link href={`/ventures/${venture.id}/recruitment`} className="inline-flex min-h-11 items-center font-semibold underline">Recruitment and trials</Link>
          </nav>}

          {draft ? <Link href={`/ventures/${venture.id}/edit`} className="primary-link min-h-12 px-4 py-3">Resume private draft</Link> : owned ? <><p className="text-sm leading-7 text-muted-foreground">{venture.status === "ACTIVE" ? "Your brief is visible to signed-in students. Review applications to find your next collaborator." : "This venture is not currently published. You can review existing applications, but new members can only be approved while it is active."}</p><Link href="#applications" className="primary-link min-h-12 w-full px-4 py-3">Review applications · {pending}</Link></> : membership?.status === "ACTIVE" ? <><p className="text-sm leading-7 text-muted-foreground">This venture is in your joined teams.</p><Link href="/ventures" className="primary-link min-h-12 px-4 py-3">Go to My Ventures</Link></> : !profile?.onboardingCompleted ? <><p className="text-sm leading-7 text-muted-foreground">Add your skills, interests and availability before applying. We’ll bring you back here to send your application.</p><Link href={entryHref("/onboarding", { goal: "JOIN_TEAM", ventureId: id })} className="primary-link min-h-12 px-4 py-3">Complete your profile to apply</Link></> : <ApplyPanel key={`${application?.id ?? "new"}-${application?.status ?? "new"}`} ventureId={id} initial={application} snapshot={snapshot} />}

        </section>

        {!owned && <div className="rounded-2xl bg-accent/60 p-6"><h2 className="font-semibold text-primary">From interest to a team</h2><ol className="mt-4 list-inside list-decimal space-y-3 text-sm leading-6 text-muted-foreground"><li>Review the idea and the help needed.</li><li>Send a thoughtful application.</li><li>The owner reviews your application. Approval adds you to the team.</li></ol></div>}

      </aside>

    </div>

  </main></StudentShell>;

}
