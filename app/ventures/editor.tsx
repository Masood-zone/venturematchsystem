"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { accountDestinationKey } from "@/hooks/auth/use-account-entry";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { VentureEditorInput } from "@/lib/venture-editor";
import { ventureStageLabels } from "@/lib/venture-dashboard";

type Option = { id: string; name: string };
const field = "w-full rounded-xl border border-border bg-background px-3 py-2";
const steps = ["Describe your venture", "Help needed", "Preview and publish"];

export default function VentureEditor({ id, initial, sectors, skills, availability, owner, published }: {
  id?: string; initial: VentureEditorInput; sectors: Option[]; skills: Option[]; availability: { id: string; label: string }[]; owner: string; published: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ventureId, setVentureId] = useState(id);
  const [draft, setDraft] = useState(initial);
  const [step, setStep] = useState(published ? 1 : initial.step);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  function update<K extends keyof VentureEditorInput>(key: K, value: VentureEditorInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function save(nextStep: number, finish = false) {
    setBusy(true);
    setError("");
    try {
      const currentId = ventureId ?? crypto.randomUUID();
      if (!ventureId) setVentureId(currentId);
      const saveUrl = id ? `/api/ventures/${currentId}` : "/api/ventures";
      const payload = { ...draft, step: nextStep };
      const response = await fetch(saveUrl, {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? payload : { id: currentId, draft: payload }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      if (!id && !finish) {
        router.replace(`/ventures/${currentId}/edit`);
        return;
      }
      if (finish) {
        if (!published) {
          const publication = await fetch(`/api/ventures/${currentId}/publish`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
          });
          if (!publication.ok) throw new Error((await publication.json()).error);
        }
        if (!published) void queryClient.invalidateQueries({ queryKey: accountDestinationKey });
        router.push(`/ventures/${currentId}`);
      } else {
        setStep(nextStep);
        router.refresh();
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save the venture.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="space-y-6 rounded-2xl border bg-card p-5 sm:p-8">
    <ol className="grid grid-cols-3 gap-3 text-sm">{steps.map((label, index) => <li key={label} aria-current={step === index + 1 ? "step" : undefined} className={step === index + 1 ? "font-bold text-primary" : "text-muted-foreground"}>{index + 1}. {label}</li>)}</ol>
    <progress className="h-2 w-full accent-functional-teal" value={step} max={3} aria-label={`Step ${step} of 3`} />
    <h1 className="text-3xl font-bold text-primary">{steps[step - 1]}</h1>
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (published && step < 3) setStep(step + 1); else void save(Math.min(step + 1, 3), step === 3); }}>
      {step === 1 && <>
        <label className="grid gap-2">Venture name<input className={field} maxLength={100} value={draft.title} onChange={(event) => update("title", event.target.value)} /></label>
        <label className="grid gap-2">What problem are you solving?<textarea className={field} maxLength={500} value={draft.problem} onChange={(event) => update("problem", event.target.value)} /></label>
        <label className="grid gap-2">Who is it for?<textarea className={field} maxLength={300} value={draft.targetUsers} onChange={(event) => update("targetUsers", event.target.value)} /></label>
        <label className="grid gap-2">Sector<select className={field} value={draft.sectorId} onChange={(event) => update("sectorId", event.target.value)}><option value="">Select a sector</option>{sectors.map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select></label>
        <label className="grid gap-2">Current stage<select className={field} value={draft.stage} onChange={(event) => update("stage", event.target.value as VentureEditorInput["stage"])}>
          {Object.entries(ventureStageLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select></label>
        <label className="grid gap-2">Expected weekly commitment<select className={field} value={draft.weeklyHoursBand} onChange={(event) => update("weeklyHoursBand", event.target.value)}>
          <option value="">Use profile availability</option>{availability.map((band) => <option key={band.id} value={band.id}>{band.label}</option>)}
        </select></label>
      </>}
      {step === 2 && <>
        <label className="grid gap-2">What practical help do you need?<textarea className={field} maxLength={1000} value={draft.contribution} onChange={(event) => update("contribution", event.target.value)} /></label>
        <fieldset className="space-y-2"><legend className="font-semibold">Confirmed skills</legend>
          <label className="grid gap-2">Search skills<input className={field} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <div className="max-h-64 space-y-2 overflow-auto rounded-xl border p-4">{skills.filter((skill) => draft.capabilityIds.includes(skill.id) || skill.name.toLowerCase().includes(query.toLowerCase())).map((skill) => <label key={skill.id} className="flex items-center gap-2">
            <input type="checkbox" checked={draft.capabilityIds.includes(skill.id)} onChange={(event) => update("capabilityIds", event.target.checked ? [...draft.capabilityIds, skill.id] : draft.capabilityIds.filter((item) => item !== skill.id))} disabled={draft.capabilityIds.length >= 30 && !draft.capabilityIds.includes(skill.id)} />{skill.name}
          </label>)}</div>
        </fieldset>
      </>}
      {step === 3 && <article className="space-y-4 rounded-xl bg-secondary p-5">
        <h2 className="text-2xl font-bold">{draft.title || "Untitled venture"}</h2><p>Owner · {owner}</p>
        <div><h3 className="font-semibold">Problem</h3><p className="whitespace-pre-wrap">{draft.problem || "Add the problem in step 1."}</p></div>
        <div><h3 className="font-semibold">Who it helps</h3><p className="whitespace-pre-wrap">{draft.targetUsers || "Add the audience in step 1."}</p></div>
        <div><h3 className="font-semibold">Sector</h3><p>{sectors.find((sector) => sector.id === draft.sectorId)?.name ?? "Choose a sector in step 1."}</p></div>
        <p>{ventureStageLabels[draft.stage ?? "IDEA"]} · {availability.find((band) => band.id === draft.weeklyHoursBand)?.label ?? "Profile availability"}</p>
        <div><h3 className="font-semibold">Help needed</h3><p className="whitespace-pre-wrap">{draft.contribution || "Add a contribution brief in step 2."}</p></div>
        <div><h3 className="font-semibold">Skills</h3><p>{skills.filter((skill) => draft.capabilityIds.includes(skill.id)).map((skill) => skill.name).join(", ") || "Confirm skills in step 2."}</p></div>
        <p className="text-sm">Publishing shares this brief and your name with signed-in students.</p>
      </article>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {step > 1 && <Button type="button" variant="outline" disabled={busy} onClick={() => setStep(step - 1)}>Back</Button>}
        {!published && <Button type="button" variant="outline" disabled={busy} onClick={() => void save(step)}>Save draft</Button>}
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : step === 3 ? published ? "Save changes" : "Publish venture" : "Continue"}</Button>
      </div>
    </form>
  </section>;
}
