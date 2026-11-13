import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DashboardLoading from "@/components/ventures/dashboard-loading";
import { Workspace, linkClass, panelClass } from "@/components/ventures/workspace";
import { entryHref } from "@/lib/student-entry";
import { getCurrentSession } from "@/services/auth/session";
import { invitationDetail } from "@/services/ventures/recruitment";
import { InvitationActions, DiscussionForm, MarkDiscussionRead } from "./invitation-actions";

async function Invitation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) redirect(entryHref("/login", { invitationId: id }));
  if (session.user.role !== "student") redirect("/");
  const invitation = await invitationDetail(id, session.user.id);
  if (!invitation) notFound();
  const owner = session.user.id === invitation.senderUserId && session.user.id === invitation.venture.ownerId;
  const discussion = ["INTERESTED", "TRIAL_PROPOSED"].includes(invitation.status);
  const latestIncoming = invitation.messages.findLast((message) => message.senderUserId !== session.user.id);

  return <Workspace title="Venture invitation" back={owner ? { label: "Back to recruitment", href: `/ventures/${invitation.ventureId}/recruitment` } : { label: "Back to My Ventures", href: "/ventures" }}>
    <article className={panelClass}>
      <Link className={linkClass} href={`/ventures/${invitation.ventureId}`}>{invitation.venture.name}</Link>
      <h2 className="text-2xl font-bold text-primary">{invitation.proposedRole ?? "Invitation to discuss"}</h2>
      <p>{owner ? "To" : "From"} · {owner ? invitation.user_venture_invitation_recipientUserIdTouser.name : invitation.user_venture_invitation_senderUserIdTouser.name}</p>
      {invitation.expectedCommitment && <p>Commitment · {invitation.expectedCommitment.toLowerCase().replaceAll("_", " ")}</p>}
      <p className="whitespace-pre-wrap wrap-anywhere">{invitation.message}</p>
      <p className="font-semibold capitalize">{invitation.status.toLowerCase().replaceAll("_", " ")}</p>
      {invitation.status === "PENDING" && <InvitationActions id={id} owner={owner} active={invitation.venture.status === "ACTIVE"} />}
      {owner && discussion && <Link className={linkClass} href={`/ventures/${invitation.ventureId}/trials/new`}>Propose group trial</Link>}
    </article>
    {discussion && <section className={panelClass}>
      {latestIncoming && <MarkDiscussionRead id={id} messageId={latestIncoming.id} />}
      <h2 className="text-xl font-bold text-primary">Private discussion</h2>
      {invitation.messages.length ? <ol className="space-y-3">{invitation.messages.map((message) => <li key={message.id} className="rounded-xl bg-secondary p-4">
        <p className="text-sm font-semibold">{message.senderUserId === session.user.id ? "You" : owner ? invitation.user_venture_invitation_recipientUserIdTouser.name : invitation.user_venture_invitation_senderUserIdTouser.name}</p>
        <p className="whitespace-pre-wrap wrap-anywhere">{message.body}</p>
        <time className="text-xs text-muted-foreground" dateTime={message.createdAt.toISOString()}>{message.createdAt.toISOString().replace("T", " ").slice(0, 16)} UTC</time>
      </li>)}</ol> : <p>No messages yet.</p>}
      {invitation.venture.status === "ACTIVE" && <DiscussionForm id={id} />}
    </section>}
  </Workspace>;
}

export default function InvitationPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<DashboardLoading />}><Invitation params={params} /></Suspense>;
}
