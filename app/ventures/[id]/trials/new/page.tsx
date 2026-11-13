import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import DashboardLoading from "@/components/ventures/dashboard-loading";
import { Workspace, panelClass } from "@/components/ventures/workspace";
import { getCurrentSession } from "@/services/auth/session";
import { eligibleTrialCandidates } from "@/services/ventures/recruitment";
import { trialDetail } from "@/services/ventures/trials";
import { TrialPlanForm } from "../../../trial-plan-form";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ previous?: string }> };
async function Propose({ params, searchParams }: Props) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "student") redirect("/");
  const [{ id }, { previous }] = await Promise.all([params, searchParams]);
  const [candidates, source] = await Promise.all([
    eligibleTrialCandidates(id, session.user.id),
    previous ? trialDetail(previous, session.user.id) : null,
  ]);
  if (!candidates || (previous && (!source?.owner || source.venture.id !== id || !["CLOSED", "INCOMPLETE"].includes(source.phase)))) notFound();

  return <Workspace title={source ? "Propose a revised group" : "Propose group trial plan"}
    back={{ label: "Back to recruitment", href: `/ventures/${id}/recruitment` }}>
    <section className={panelClass}>
      {source && <p>Based on the closed trial · {source.plan.objective}</p>}
      {candidates.length ? <TrialPlanForm ventureId={id} owner={{ id: session.user.id, name: session.user.name, role: "Owner" }}
        candidates={candidates} previousId={source?.id} initial={source ? {
          objective: source.plan.objective, expectations: "", candidateIds: [], startDay: "", reviewAt: "",
          tasks: source.plan.tasks.map(({ title, description }) => ({ title, description, assigneeId: null })),
        } : undefined} /> : <p>No interested candidates are available. Invite students to discuss a role first.</p>}
    </section>
  </Workspace>;
}
export default function ProposeTrialPage(props: Props) {
  return <Suspense fallback={<DashboardLoading />}><Propose {...props} /></Suspense>;
}
