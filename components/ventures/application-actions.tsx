"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { applicationStatusLabels, declineReasonMaxLength, type ApplicationView, type ApplicationSnapshot } from "@/lib/venture-applications";
import { levels } from "@/lib/onboarding";
import { entryHref } from "@/lib/student-entry";

async function submitApplication(url: string, method: string, body: unknown): Promise<ApplicationView> {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (response.status === 401) throw new Error("Your session has expired. Sign in again to continue.");
  if (!response.ok) throw new Error(data.error ?? "Unable to update application. Please retry.");
  return data;
}

export function ApplicationProfile({ snapshot }: { snapshot: ApplicationSnapshot }) {
  return <div className="space-y-3 text-sm">
    <p className="wrap-anywhere font-semibold text-primary">{snapshot.name}</p>
    {snapshot.programme && <p className="text-muted-foreground">{snapshot.programme}</p>}
    <ul className="flex flex-wrap gap-2">{snapshot.skills.map((skill) => <li key={skill.name} className="onboarding-chip max-w-full wrap-anywhere">{skill.name} · {levels.find((level) => level.value === skill.proficiency)?.label ?? skill.proficiency}</li>)}</ul>
    <p className="text-muted-foreground">{snapshot.interests.join(" · ")}</p>
    {snapshot.availability && <p>{snapshot.availability} / week</p>}
    {snapshot.contributionIntro && <p className="whitespace-pre-wrap leading-7"><strong>What I can contribute: </strong>{snapshot.contributionIntro}</p>}
    {snapshot.teamGoals && <p className="whitespace-pre-wrap leading-7"><strong>What I’m looking for: </strong>{snapshot.teamGoals}</p>}
  </div>;
}

export function ApplicationCard({ application, owner = false }: { application: ApplicationView; owner?: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState(application);
  const [action, setAction] = useState<"approve" | "decline" | "withdraw" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (!action || busy || (action === "decline" && !reason.trim())) return;
    setBusy(true); setError("");
    try {
      const decision = action === "decline" ? { action, reason: reason.trim() } : { action };
      const result = await submitApplication(`/api/ventures/${current.ventureId}/applications/${current.id}`, "PATCH", decision);
      setCurrent(result); setAction(null); setReason(""); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to save your decision."); }
    finally { setBusy(false); }
  }
  return <article className="space-y-4 rounded-2xl border border-border bg-white p-5 sm:p-6" aria-busy={busy}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="wrap-anywhere font-semibold text-primary">{owner ? current.snapshot.name : current.ventureName}</h3>
      <span role="status" className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-functional-teal">{applicationStatusLabels[current.status]}</span>
    </div>
    <p className="text-xs text-muted-foreground">Applied {current.createdAt.slice(0, 10)}{current.respondedAt ? ` · Updated ${current.respondedAt.slice(0, 10)}` : ""}</p>
    {owner && <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-functional-teal">View submitted profile</summary><ApplicationProfile snapshot={current.snapshot} /></details>}
    <p className="whitespace-pre-wrap break-words text-sm leading-7">{current.message}</p>
    {!owner && current.ventureActive && <Link href={`/ventures/${current.ventureId}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-functional-teal underline">View venture</Link>}
    {current.status === "PENDING" && <div className="flex flex-wrap gap-3">
      {owner ? <><Button type="button" disabled={busy || !current.ventureActive} onClick={() => { setAction("approve"); setError(""); }}>Approve</Button><Button type="button" variant="outline" disabled={busy} onClick={() => { setAction("decline"); setError(""); }}>Decline</Button></> : <Button type="button" variant="outline" disabled={busy} onClick={() => { setAction("withdraw"); setError(""); }}>Withdraw application</Button>}
    </div>}
    {current.status === "PENDING" && !current.ventureActive && <p className="text-sm text-muted-foreground">This venture is no longer accepting members.</p>}
    {action && <div className="space-y-3 rounded-xl bg-secondary p-4" role="region" aria-label="Confirm application action">
      <p className="text-sm leading-6">{action === "approve" ? "Approve this application and add this student to your team?" : action === "decline" ? "Declining is final. The reason you enter will be emailed to the applicant." : "Withdraw this application? You can apply again while the venture is active."}</p>
      {action === "decline" && <label className="onboarding-label">
        Reason for declining
        <textarea className="onboarding-input mt-2" rows={4} required maxLength={declineReasonMaxLength} disabled={busy} value={reason} onChange={(event) => setReason(event.target.value)} />
      </label>}
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={busy || (action === "decline" && !reason.trim())} onClick={confirm}>{busy ? "Saving…" : action === "decline" ? "Confirm decline" : "Confirm"}</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => { setAction(null); setReason(""); setError(""); }}>Cancel</Button>
      </div>
    </div>}
    {error && <div role="alert" className="text-sm text-destructive"><p>{error}</p>{error.includes("session has expired") && <Link href={entryHref("/login", { ventureId: current.ventureId })} className="inline-flex min-h-11 items-center underline">Sign in again</Link>}</div>}
  </article>;
}

export function ApplyPanel({ ventureId, initial, snapshot }: { ventureId: string; initial: ApplicationView | null; snapshot: ApplicationSnapshot }) {
  const router = useRouter();
  const [application, setApplication] = useState(initial);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !consent) return;
    setBusy(true); setError("");
    try {
      const result = await submitApplication(`/api/ventures/${ventureId}/applications`, "POST", { message, shareProfile: consent });
      setApplication(result); setOpen(false); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to submit. Please retry."); }
    finally { setBusy(false); }
  }
  if (application && application.status !== "WITHDRAWN") return <ApplicationCard key={`${application.id}-${application.status}`} application={application} />;
  return <div className="space-y-4">
    <p className="text-sm leading-7 text-muted-foreground">Tell the owner why you’d like to join and how you could contribute. You become a member when the owner approves.</p>
    {application?.status === "WITHDRAWN" && <p className="text-sm text-muted-foreground">Your previous application was withdrawn.</p>}
    {!open ? <Button type="button" className="min-h-12 w-full" onClick={() => setOpen(true)}>{application ? "Apply again" : "Apply to join"}</Button> : <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
      <fieldset disabled={busy} className="space-y-4"><legend className="sr-only">Apply to join this venture</legend>
        <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-functional-teal">Your application profile</summary><ApplicationProfile snapshot={snapshot} /><Link href="/profile/edit" className="inline-flex min-h-11 items-center text-sm text-functional-teal underline">Edit profile before applying</Link></details>
        <label className="onboarding-label">Why would you like to join?<textarea className="onboarding-input mt-2" rows={6} required maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Introduce yourself and describe how you could help this venture." /></label>
        <label className="flex items-start gap-3 text-xs leading-6 text-muted-foreground"><input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 size-4 shrink-0 accent-functional-teal" /><span>Share my name, programme, skills, interests, availability and introductions with this venture’s owner, even if my profile is hidden. My email and private ideas stay private.</span></label>
        <div className="flex flex-wrap gap-3"><Button type="submit" disabled={!consent || !message.trim()}>{busy ? "Submitting…" : "Submit application"}</Button><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button></div>
      </fieldset>
      {error && <div role="alert" className="text-sm text-destructive"><p>{error}</p>{error.includes("session has expired") && <Link href={entryHref("/login", { ventureId })} className="inline-flex min-h-11 items-center underline">Sign in again</Link>}</div>}
    </form>}
  </div>;
}
