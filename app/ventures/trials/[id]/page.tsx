import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DashboardLoading from "@/components/ventures/dashboard-loading";
import { Workspace, linkClass, panelClass } from "@/components/ventures/workspace";
import { entryHref } from "@/lib/student-entry";
import { getCurrentSession } from "@/services/auth/session";
import { eligibleTrialCandidates } from "@/services/ventures/recruitment";
import { trialDetail } from "@/services/ventures/trials";
import { TrialPlanForm } from "../../trial-plan-form";
import { ExtensionForm, TrialButton, TrialReviewForm, TrialTaskActions } from "./trial-actions";
import { Button } from "@/components/ui/button";

const phases = {
  AGREEMENT: "Trial agreement status", ACTIVE: "Active group trial", REVIEW: "Private review",
  EXTENSION: "Trial extension", FORMED: "Team formed", CLOSED: "Trial closed", INCOMPLETE: "Trial closed as incomplete",
};
const displayTime = (value: string) => `${value.replace("T", " ").slice(0, 16)} UTC`;

async function Trial({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) redirect(entryHref("/login", { trialId: id }));
  if (session.user.role !== "student") redirect("/");
  const trial = await trialDetail(id, session.user.id);
  if (!trial) notFound();
  const { phase, plan, version, round, owner, viewer, roster, venture, deadline } = trial;
  const candidates = owner && phase === "AGREEMENT" ? await eligibleTrialCandidates(venture.id, viewer.id) : null;
  const expiredPlan = trial.startState === "EXPIRED";
  const canStart = owner && phase === "AGREEMENT" && trial.startState === "TODAY" && roster.every((person) => person.response === "ACCEPTED");
  const canAct = !viewer.withdrawn;
  const signed = roster.filter((person) => person.response === "ACCEPTED").length;

  return <Workspace title={phase === "AGREEMENT" && !owner ? "Review the group trial plan" : phases[phase]}
    back={owner ? { label: "Back to recruitment", href: `/ventures/${venture.id}/recruitment` } : { label: "Back to My Ventures", href: "/ventures" }}>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <div className="space-y-6">
        <section className={panelClass}>
          <p className="font-semibold text-functional-teal">{venture.name}</p>
          <h2 className="text-2xl font-bold text-primary">Trial objective</h2>
          <p className="whitespace-pre-wrap wrap-anywhere">{plan.objective}</p>
          <h3 className="font-semibold">Contribution expectations</h3>
          <p className="whitespace-pre-wrap wrap-anywhere">{plan.expectations}</p>
          {phase === "AGREEMENT" && <div className="space-y-3 rounded-xl bg-secondary p-4">
            <p>Plan version {version}</p>
            <p>Your agreement · {viewer.response.toLowerCase()}</p>
            {expiredPlan ? <p>The scheduled start has passed. The owner needs to propose fresh dates.</p> :
              viewer.response === "PENDING" && <div className="flex flex-wrap gap-3">
                <TrialButton id={id} label="Accept trial plan" action={{ action: "agree", version }} />
                <TrialButton id={id} label="Decline trial plan" action={{ action: "decline", version }} secondary />
              </div>}
            {canStart && <TrialButton id={id} label="Start group trial" action={{ action: "start", version }} />}
            {owner && !canStart && <div className="space-y-2">
              <Button disabled>Start group trial</Button>
              <p className="text-sm text-muted-foreground">{signed === roster.length ? "Start on the agreed UTC day." : "Everyone must accept the current plan before the trial can start."}</p>
            </div>}
          </div>}
        </section>
        {phase === "AGREEMENT" && owner && candidates && <details key={version} className={panelClass}>
          <summary className="cursor-pointer text-lg font-bold">Revise trial plan</summary>
          <p>Everyone will be asked to agree again.</p>
          <TrialPlanForm trialId={id} version={version} ventureId={venture.id} owner={viewer} candidates={candidates}
            initial={{ ...plan, candidateIds: plan.candidateIds.filter((candidateId) => candidates.some((candidate) => candidate.id === candidateId)) }} />
        </details>}
        <section className={panelClass}>
          <h2 className="text-xl font-bold text-primary">Trial tasks</h2>
          <ul className="space-y-4">{trial.tasks.map((task) => <li className="space-y-3 rounded-xl border p-4" key={task.id}>
            <h3 className="font-semibold wrap-anywhere">{task.title}</h3>
            <p className="whitespace-pre-wrap wrap-anywhere">{task.description}</p>
            <p className="text-sm">Assigned to {roster.find((person) => person.id === task.assigneeId)?.name ?? "nobody"} · {task.status.toLowerCase().replaceAll("_", " ")}</p>
            {task.text && <p className="whitespace-pre-wrap wrap-anywhere">{task.text}</p>}
            {task.link && <a className={linkClass} href={task.link} target="_blank" rel="noreferrer">Open work submission</a>}
            {task.submittedBy && <p className="text-sm text-muted-foreground">Updated by {roster.find((person) => person.id === task.submittedBy)?.name}</p>}
            {phase === "ACTIVE" && canAct && <TrialTaskActions key={JSON.stringify(task)} id={id} task={task} roster={roster} owner={owner} viewerId={viewer.id} />}
          </li>)}</ul>
        </section>
        {phase === "REVIEW" && <section className={panelClass}>
          <h2 className="text-xl font-bold text-primary">Your private review</h2>
          <p>Submit by {displayTime(deadline)}. The group sees the collective result.</p>
          {trial.ownReview ? <p>Your review was submitted. Waiting for the collective result.</p> : canAct && <TrialReviewForm id={id} round={round} />}
        </section>}
        {phase === "EXTENSION" && <section className={panelClass}>
          <h2 className="text-xl font-bold text-primary">Agree to an extension</h2>
          <p>Everyone still in the trial must agree by {displayTime(deadline)}.</p>
          {trial.extension ? <>
            <p>Proposed review · {displayTime(trial.extension.reviewAt)}</p>
            {canAct && (trial.extension.accepted ? <p>You accepted the proposed time.</p> : <TrialButton id={id} label="Accept revised review time" action={{ action: "agree-extension", round, proposalId: trial.extension.id }} />)}
          </> : <p>Waiting for the owner to propose a new review time.</p>}
          {owner && canAct && <ExtensionForm id={id} round={round} />}
        </section>}
        {phase === "FORMED" && <section className={panelClass}>
          <h2 className="text-xl font-bold text-primary">The continuing team is ready</h2>
          <Link href="/ventures" className={linkClass}>Open My Ventures</Link>
        </section>}
        {["CLOSED", "INCOMPLETE"].includes(phase) && <section className={panelClass}>
          <p>{phase === "INCOMPLETE" ? "The agreement deadline passed before the trial could reach a complete outcome." : "This trial ended without forming a team."}</p>
          {owner && venture.status === "ACTIVE" && <Link className={linkClass} href={`/ventures/${venture.id}/trials/new?previous=${encodeURIComponent(id)}`}>Propose a revised group</Link>}
        </section>}
      </div>
      <aside className={`${panelClass} ${phase === "AGREEMENT" && owner ? "row-start-1 lg:col-start-2" : ""}`}>
        <h2 className="text-xl font-bold text-primary">Trial roster</h2>
        {owner && phase === "AGREEMENT" && <div><p className="text-sm">{signed} of {roster.length} accepted</p><progress className="h-2 w-full accent-functional-teal" aria-label="Accepted trial agreements" max={roster.length} value={signed} /></div>}
        <ul className="space-y-3">{roster.map((person) => <li key={person.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary p-3">
          <div><p className="font-semibold">{person.name}{person.id === viewer.id ? " (you)" : ""}</p>
          {person.role && <p className="text-sm text-muted-foreground">{person.role}</p>}</div>
          {(person.withdrawn || person.response) && <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold capitalize">{person.withdrawn ? "Withdrawn" : person.response?.toLowerCase()}</span>}
        </li>)}</ul>
        <dl className="space-y-2"><div><dt className="font-semibold">Start day</dt><dd>{plan.startDay} UTC</dd></div>
          <div><dt className="font-semibold">Review opens</dt><dd>{displayTime(trial.reviewAt)}</dd></div></dl>
        {canAct && ["ACTIVE", "REVIEW", "EXTENSION"].includes(phase) && <details className="rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">Withdraw from trial</summary>
          <div className="mt-3 space-y-3"><p>{owner ? "Withdrawing closes the trial for the whole group." : "Your unfinished tasks can be reassigned. The trial closes if you are the last candidate."}</p>
            <TrialButton id={id} label="Confirm withdrawal" action={{ action: "withdraw" }} secondary />
          </div>
        </details>}
      </aside>
    </div>
  </Workspace>;
}

export default function TrialPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<DashboardLoading />}><Trial params={params} /></Suspense>;
}
