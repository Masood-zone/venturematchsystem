"use client";
import { ActionForm } from "@/components/ventures/action-form";
import { fieldClass } from "@/components/ventures/workspace-styles";
import type { TrialAction, TrialState } from "@/lib/group-trial";

export function TrialButton({ id, label, action, secondary }: { id: string; label: string; action: TrialAction; secondary?: boolean }) {
  return <ActionForm url={`/api/ventures/trials/${id}`} label={label} secondary={secondary} payload={() => action} />;
}

export function TrialTaskActions({ id, task, roster, owner, viewerId }: {
  id: string; task: TrialState["tasks"][number]; roster: { id: string; name: string; withdrawn: boolean }[]; owner: boolean; viewerId: string;
}) {
  const url = `/api/ventures/trials/${id}`;
  return <div className="space-y-5">
    {owner && <ActionForm url={url} label="Save assignment" secondary payload={(values) => ({ action: "assign", taskId: task.id, assigneeId: values.get("assigneeId") || null })}>
      <label className="grid gap-2">Assignee<select className={fieldClass} name="assigneeId" defaultValue={task.assigneeId ?? ""}>
        <option value="">Unassigned</option>{roster.filter((person) => !person.withdrawn).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
      </select></label>
    </ActionForm>}
    {task.assigneeId === viewerId && <ActionForm url={url} label="Save task update" payload={(values) => ({
      action: "work", taskId: task.id, status: values.get("status"), text: values.get("text"), link: values.get("link"),
    })}>
      <label className="grid gap-2">Progress<select className={fieldClass} name="status" defaultValue={task.status}>
        <option value="PENDING">Pending</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Complete and submit</option>
      </select></label>
      <label className="grid gap-2">Work notes<textarea className={fieldClass} name="text" defaultValue={task.text} maxLength={4000} /></label>
      <label className="grid gap-2">Work link<input className={fieldClass} type="url" name="link" defaultValue={task.link} maxLength={1000} /></label>
    </ActionForm>}
  </div>;
}

const scores = ["communication", "reliability", "contribution", "commitment", "alignment"] as const;

export function TrialReviewForm({ id, round }: { id: string; round: number }) {
  return <ActionForm url={`/api/ventures/trials/${id}`} label="Submit private decision" payload={(values) => ({
    action: "review", round, review: {
      decision: values.get("decision"), scores: Object.fromEntries(scores.map((score) => [score, Number(values.get(score))])),
      workedWell: values.get("workedWell"), concerns: values.get("concerns"),
    },
  })}>
    <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-3 font-semibold">Rate the trial from 1 to 5</legend>
      {scores.map((score) => <label key={score} className="grid gap-2 capitalize">{score}
        <select className={fieldClass} name={score} required defaultValue=""><option value="" disabled>Choose a rating</option>{[1, 2, 3, 4, 5].map((rating) => <option key={rating}>{rating}</option>)}</select>
      </label>)}
    </fieldset>
    <label className="grid gap-2">What worked well?<textarea className={fieldClass} name="workedWell" maxLength={2000} /></label>
    <label className="grid gap-2">Concerns<textarea className={fieldClass} name="concerns" maxLength={2000} /></label>
    <label className="grid gap-2">Your decision<select className={fieldClass} name="decision" required defaultValue="">
      <option value="" disabled>Choose a decision</option><option value="CONTINUE">Continue as a team</option><option value="EXTEND">I need more time</option><option value="STOP">Stop here</option>
    </select></label>
  </ActionForm>;
}

export function ExtensionForm({ id, round }: { id: string; round: number }) {
  return <ActionForm url={`/api/ventures/trials/${id}`} label="Propose new review time" payload={(values) => ({
    action: "extend", round, reviewAt: new Date(`${values.get("reviewAt")}Z`).toISOString(),
  })}>
    <label className="grid gap-2">New review time (UTC)<input className={fieldClass} type="datetime-local" name="reviewAt" required /></label>
  </ActionForm>;
}
