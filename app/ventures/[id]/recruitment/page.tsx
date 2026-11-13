import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/services/auth/session";
import { recruitment } from "@/services/ventures/recruitment";
import { trialList } from "@/services/ventures/trials";
import { Workspace, linkClass, panelClass } from "@/components/ventures/workspace";
import DashboardLoading from "@/components/ventures/dashboard-loading";
import { CandidateInvitation } from "./recruitment-actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ skill?: string; candidate?: string }> };

async function Recruitment({ params, searchParams }: Props) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "student") redirect("/");
  const [{ id }, { skill, candidate }] = await Promise.all([params, searchParams]);
  const view = await recruitment(id, session.user.id, skill);
  if (!view) notFound();
  const trials = await trialList(session.user.id, id);
  const base = `/ventures/${id}/recruitment`;
  const selected = view.students.find((student) => student.id === candidate);
  const matchedSkills = new Set(view.needs.map((need) => need.id));
  const hours = new Map(view.availability.map((option) => [option.id, option.label]));

  return <Workspace title={`Recruit for ${view.venture.name}`} back={{ href: `/ventures/${id}`, label: "Back to venture" }}>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <section className={panelClass}>
        <h2 className="text-xl font-bold text-primary">Candidates</h2>
        {view.venture.status !== "ACTIVE" ? <p>Publish the venture to recruit candidates.</p> : <>
          <nav aria-label="Filter candidates by confirmed skill" className="flex flex-wrap gap-2">
            <Link className="onboarding-chip" aria-current={!skill ? "page" : undefined} href={base}>All skills</Link>
            {view.needs.map((need) => <Link className="onboarding-chip" aria-current={need.id === skill ? "page" : undefined} key={need.id} href={`${base}?skill=${encodeURIComponent(need.id)}`}>{need.name}</Link>)}
          </nav>
          {selected ? <article className="space-y-4 rounded-xl border p-5">
            <Link className={linkClass} href={skill ? `${base}?skill=${encodeURIComponent(skill)}` : base}>Back to candidates</Link>
            <h3 className="text-2xl font-bold text-primary">{selected.user.name}</h3>
            <p>{selected.academic_profile?.programme}</p>
            <h4 className="font-semibold">Skill coverage</h4>
            <ul className="space-y-1">{selected.student_capability.map(({ capability, proficiency }) => <li key={capability.id}>{capability.name} · {proficiency.toLowerCase()}{matchedSkills.has(capability.id) && <strong className="ml-2 text-functional-teal">Venture need</strong>}</li>)}</ul>
            <p>Availability · {hours.get(selected.student_availability?.weeklyHoursBand ?? "") ?? "Unspecified"}</p>
            <p>Venture commitment · {hours.get(view.venture.weeklyHoursBand ?? "") ?? "Unspecified"}</p>
            <CandidateInvitation ventureId={id} candidateId={selected.id} />
          </article> : <ul className="space-y-3">{view.students.map((student) => {
            const skills = student.student_capability.filter(({ capability }) => matchedSkills.has(capability.id));
            const query = new URLSearchParams({ candidate: student.id, ...(skill ? { skill } : {}) });
            return <li key={student.id} className="rounded-xl border p-4">
              <h3 className="font-bold text-primary">{student.user.name}</h3>
              <p className="text-sm text-muted-foreground">{skills.map(({ capability }) => capability.name).join(", ") || "No listed skills match the confirmed needs"}</p>
              <p className="text-sm">{hours.get(student.student_availability?.weeklyHoursBand ?? "") ?? "Availability unspecified"}</p>
              <Link href={`${base}?${query}`} className={linkClass}>Evaluate candidate</Link>
            </li>;
          })}</ul>}
          {!selected && !view.students.length && <p>No discoverable candidates match this filter.</p>}
        </>}
      </section>
      <aside className="space-y-6">
        <section className={panelClass}>
          <h2 className="text-xl font-bold text-primary">Invitations</h2>
          {view.invitations.length ? <ul>{view.invitations.map((invitation) => <li key={invitation.id} className="border-b py-2 last:border-0"><Link href={`/ventures/invitations/${invitation.id}`} className={linkClass}>{invitation.user_venture_invitation_recipientUserIdTouser.name}</Link><p className="text-sm">{invitation.unread ? "New message" : invitation.status.toLowerCase().replaceAll("_", " ")}</p></li>)}</ul> : <p>No invitations sent yet.</p>}
        </section>
        <section className={panelClass}>
          <h2 className="text-xl font-bold text-primary">Group trials</h2>
          {view.invitations.some((invitation) => ["INTERESTED", "TRIAL_PROPOSED"].includes(invitation.status)) && view.venture.status === "ACTIVE" &&
            <Link href={`/ventures/${id}/trials/new`} className={linkClass}>Propose group trial</Link>}
          {trials.length ? <ul>{trials.map((trial) => <li key={trial.id}><Link href={`/ventures/trials/${trial.id}`} className={linkClass}>{trial.objective}</Link></li>)}</ul> : <p>No trials yet.</p>}
        </section>
      </aside>
    </div>
  </Workspace>;
}

export default function RecruitmentPage(props: Props) {
  return <Suspense fallback={<DashboardLoading />}><Recruitment {...props} /></Suspense>;
}
