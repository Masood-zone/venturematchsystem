"use client";
import { useRef, useState } from "react";
import { ActionForm } from "@/components/ventures/action-form";
import { fieldClass } from "@/components/ventures/workspace-styles";
import type { TrialPlan } from "@/lib/group-trial";
import { Button } from "@/components/ui/button";

export type TrialCandidate = { id: string; name: string; role: string | null };

export function TrialPlanForm({ ventureId, owner, candidates, initial, trialId, version, previousId }: {
  ventureId: string; owner: TrialCandidate; candidates: TrialCandidate[]; initial?: TrialPlan;
  trialId?: string; version?: number; previousId?: string;
}) {
  const requestId = useRef<string | null>(null);
  const [selected, setSelected] = useState(initial?.candidateIds ?? []);
  const [tasks, setTasks] = useState(() => (initial?.tasks ?? [{ title: "", description: "", assigneeId: null }]).map((task, key) => ({ ...task, key })));
  const nextKey = useRef(tasks.length);
  const roster = [owner, ...candidates.filter((candidate) => selected.includes(candidate.id))];

  return <ActionForm method={trialId ? "PATCH" : "POST"} url={trialId ? `/api/ventures/trials/${trialId}` : `/api/ventures/${ventureId}/trials`}
    redirectBase={trialId ? undefined : "/ventures/trials"} label={trialId ? "Send revised plan" : "Send plan for agreement"} payload={(values) => {
      const reviewAt = new Date(`${values.get("reviewAt")}Z`);
      const plan = {
        objective: values.get("objective"), expectations: values.get("expectations"), candidateIds: selected,
        startDay: values.get("startDay"), reviewAt: reviewAt.toISOString(),
        tasks: tasks.map((task) => ({
          title: values.get(`title-${task.key}`), description: values.get(`description-${task.key}`),
          assigneeId: values.get(`assignee-${task.key}`) || null,
        })),
      };
      if (trialId) return { action: "revise", version, plan };
      requestId.current ??= crypto.randomUUID();
      return { id: requestId.current, previousId, plan };
    }}>
    <label className="grid gap-2">Shared objective<textarea className={fieldClass} required maxLength={1000} name="objective" defaultValue={initial?.objective} /></label>
    <label className="grid gap-2">Contribution expectations<textarea className={fieldClass} required maxLength={1000} name="expectations" defaultValue={initial?.expectations} /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2">Start day (UTC)<input className={fieldClass} type="date" name="startDay" required defaultValue={initial?.startDay} /></label>
      <label className="grid gap-2">Review time (UTC)<input className={fieldClass} type="datetime-local" name="reviewAt" required defaultValue={initial?.reviewAt.slice(0, 16)} /></label>
    </div>
    <fieldset className="space-y-3 rounded-xl border p-4">
      <legend className="px-2 font-semibold">Trial roster</legend>
      <p>{owner.name} · Owner</p>
      {candidates.map((candidate) => <label key={candidate.id} className="flex items-center gap-2">
        <input type="checkbox" checked={selected.includes(candidate.id)} disabled={selected.length >= 12 && !selected.includes(candidate.id)}
          onChange={(event) => setSelected((current) => event.target.checked ? [...current, candidate.id] : current.filter((id) => id !== candidate.id))} />
        {candidate.name}{candidate.role ? ` · ${candidate.role}` : ""}
      </label>)}
    </fieldset>
    <fieldset className="space-y-4">
      <legend className="font-semibold">Initial tasks</legend>
      {tasks.map((task, index) => <div key={task.key} className="space-y-3 rounded-xl border p-4">
        <label className="grid gap-2">Task {index + 1}<input className={fieldClass} required maxLength={100} name={`title-${task.key}`} defaultValue={task.title} /></label>
        <label className="grid gap-2">Deliverable<textarea className={fieldClass} maxLength={1000} name={`description-${task.key}`} defaultValue={task.description} /></label>
        <label className="grid gap-2">Assignee<select className={fieldClass} name={`assignee-${task.key}`} defaultValue={task.assigneeId ?? ""}><option value="">Unassigned</option>
          {roster.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
        </select></label>
        {tasks.length > 1 && <Button type="button" variant="outline" onClick={() => setTasks((current) => current.filter((item) => item.key !== task.key))}>Remove task {index + 1}</Button>}
      </div>)}
      {tasks.length < 12 && <Button type="button" variant="outline" onClick={() => {
        const key = nextKey.current++;
        setTasks((current) => [...current, { key, title: "", description: "", assigneeId: null }]);
      }}>Add task</Button>}
    </fieldset>
  </ActionForm>;
}
