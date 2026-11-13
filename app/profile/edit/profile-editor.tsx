"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SkillPicker, { type Selection } from "@/components/onboarding/skill-picker";
import ProfileIntroductions from "@/components/onboarding/profile-introductions";
import { profileSchema } from "@/lib/student-profile";
import type { OnboardingState } from "@/services/onboarding/service";

export default function ProfileEditor({ initial }: { initial: OnboardingState }) {
  const router = useRouter();
  const queries = useQueryClient();
  const [skills, setSkills] = useState<Selection[]>(initial.skills);
  const [sectorIds, setSectorIds] = useState(initial.sectorIds);
  const [hours, setHours] = useState(initial.weeklyHoursBand);
  const [contributionIntro, setContributionIntro] = useState(initial.contributionIntro);
  const [teamGoals, setTeamGoals] = useState(initial.teamGoals);
  const [visible, setVisible] = useState(initial.discoverability);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setSaved(false); setError(""); setExpired(false);
    const parsed = profileSchema.safeParse({ skills, sectorIds, weeklyHoursBand: hours, discoverability: visible, contributionIntro, teamGoals });
    if (!parsed.success) { setError(parsed.error.issues.map((issue) => issue.message).join(" ")); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/me/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      if (response.status === 401) { setExpired(true); throw new Error("Your session has expired. Sign in again before saving."); }
      if (!response.ok) { const data = await response.json(); throw new Error(data.error ?? "Unable to save your profile."); }
      await queries.invalidateQueries({ queryKey: ["onboarding"] });
      setSaved(true); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to save. Please retry."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-6" aria-busy={busy} onChange={() => setSaved(false)}>
    <fieldset disabled={busy} className="space-y-6">
      <legend className="sr-only">Edit profile</legend>
      <SkillPicker catalogues={initial.catalogues} selected={skills} onChange={(selection) => { setSkills(selection); setSaved(false); }} disabled={busy} />
      <section className="space-y-6 rounded-2xl border border-border bg-white p-6 sm:p-8">
        <fieldset><legend className="mb-4 font-semibold text-primary">Areas you’d like to work in</legend>
          {sectorIds.some((id) => !initial.catalogues.sectors.some((sector) => sector.id === id)) && <button type="button" onClick={() => setSectorIds(sectorIds.filter((id) => initial.catalogues.sectors.some((sector) => sector.id === id)))} className="mb-3 min-h-11 text-sm text-destructive underline">Remove unavailable interests</button>}
          <div className="grid gap-3 sm:grid-cols-2">{initial.catalogues.sectors.map((sector) => <label key={sector.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" className="size-4 accent-functional-teal" checked={sectorIds.includes(sector.id)} onChange={(event) => setSectorIds(event.target.checked ? [...sectorIds, sector.id] : sectorIds.filter((id) => id !== sector.id))} />{sector.name}</label>)}</div>
        </fieldset>
        <label className="onboarding-label">Weekly availability<select className="onboarding-input mt-2" value={hours} onChange={(event) => setHours(event.target.value)} required><option value="">Choose availability</option>{initial.catalogues.availability.map((option) => <option key={option.id} value={option.id}>{option.label} / week</option>)}</select></label>
        <ProfileIntroductions contributionIntro={contributionIntro} teamGoals={teamGoals} onContributionChange={setContributionIntro} onGoalsChange={setTeamGoals} />
        <label className="flex items-start gap-3 rounded-xl bg-secondary p-4 text-sm"><input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} className="mt-1 size-4 accent-functional-teal" /><span><strong className="block">Let students discover my profile</strong><span className="mt-2 block leading-6 text-muted-foreground">Share my name, programme, skills and levels, interests and availability with signed-in students. Email and private ideas stay hidden. Hiding my profile does not change my applications or memberships.</span></span></label>
      </section>
    </fieldset>
    {error && <p role="alert" className="rounded-xl bg-white p-4 text-sm text-destructive">{error}</p>}
    {expired && <Link href="/login" className="inline-flex min-h-11 items-center text-sm font-semibold text-functional-teal underline">Sign in again</Link>}
    {saved && <p role="status" className="rounded-xl bg-accent p-4 text-sm text-functional-teal">Your profile has been saved.</p>}
    <div className="flex flex-wrap items-center gap-4"><Button type="submit" disabled={busy} className="min-h-12">{busy ? "Saving…" : "Save profile"}</Button><Link href="/explore" className="inline-flex min-h-12 items-center text-sm font-semibold text-functional-teal underline">{saved ? "Back to Explore" : "Cancel"}</Link></div>
  </form>;
}
