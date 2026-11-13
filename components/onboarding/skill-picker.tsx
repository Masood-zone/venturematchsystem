"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { levels, normalizeSkill } from "@/lib/onboarding";
import type { OnboardingState } from "@/services/onboarding/service";

type Skill = OnboardingState["catalogues"]["skills"][number];
export type Selection = { id: string; name: string; proficiency: string };
type Props = {
  catalogues: OnboardingState["catalogues"];
  selected: Selection[];
  onChange: (skills: Selection[]) => void;
  onCreate?: (input: { name: string; familyId: string; proficiency: string }) => Promise<Skill>;
  disabled: boolean;
  needs?: boolean;
};
export default function SkillPicker({ catalogues, selected, onChange, onCreate, disabled, needs = false }: Props) {
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("");
  const [custom, setCustom] = useState(false);
  const [customFamily, setCustomFamily] = useState("");
  const [customLevel, setCustomLevel] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const query = normalizeSkill(search);
  const matching = catalogues.skills.filter((skill) => (!family || query || skill.familyId === family) && normalizeSkill(skill.name).includes(query));
  const suggestions = query || family ? matching : catalogues.families.flatMap((row) => matching.filter((skill) => skill.familyId === row.id).slice(0, 2));
  const tokens = query.split(/[^\p{L}\p{N}+#]+/u).filter((token) => token.length > 2);
  const related = query ? catalogues.skills.filter((skill) => !matching.some((row) => row.id === skill.id) && tokens.some((token) => normalizeSkill(skill.name).includes(token))).slice(0, 6) : [];
  const chosen = new Set(selected.map((skill) => skill.id));
  async function create() {
    if (!onCreate) return;
    if (!search.trim() || !customFamily || !customLevel) { setError("Enter a skill, choose its category and choose your level."); return; }
    setAdding(true); setError("");
    try {
      const skill = await onCreate({ name: search, familyId: customFamily, proficiency: customLevel });
      if (!chosen.has(skill.id)) onChange([...selected, { ...skill, proficiency: customLevel }]);
      setSearch(""); setCustom(false);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to add skill. Please retry."); }
    finally { setAdding(false); }
  }
  return <div className="space-y-6">
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-7">
      <label htmlFor={needs ? "needs-search" : "skills-search"} className="mb-2 block text-sm font-semibold">Search all skills</label>
      <Input id={needs ? "needs-search" : "skills-search"} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Try bookkeeping, sewing, research or web development" className="auth-input" disabled={disabled || adding} />
      <p className="mt-2 text-xs text-muted-foreground">Search includes every category, regardless of your programme.</p>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="Skill categories">
        <button type="button" aria-pressed={!family} onClick={() => setFamily("")} className={`onboarding-chip ${!family ? "onboarding-selected" : ""}`}>All fields</button>
        {catalogues.families.map((row) => <button type="button" key={row.id} aria-pressed={family === row.id} onClick={() => setFamily(row.id)} className={`onboarding-chip ${family === row.id ? "onboarding-selected" : ""}`}>{row.name}</button>)}
      </div>
      <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{query ? `${matching.length} matching skills` : family ? "Skills in this category" : "Suggestions across fields"}</p>
      <div className="flex max-h-80 flex-wrap gap-2 overflow-y-auto p-1">
        {suggestions.map((skill) => <button type="button" key={skill.id} aria-pressed={chosen.has(skill.id)} disabled={disabled || adding} className={`onboarding-chip ${chosen.has(skill.id) ? "onboarding-selected" : ""}`} onClick={() => onChange(chosen.has(skill.id) ? selected.filter((row) => row.id !== skill.id) : [...selected, { id: skill.id, name: skill.name, proficiency: "" }])}>{chosen.has(skill.id) ? "✓" : "+"} {skill.name}</button>)}
      </div>
      {!suggestions.length && <p className="text-sm text-muted-foreground" role="status">No matching skills. Try another phrase{onCreate ? " or add the missing skill below." : "."}</p>}
      {related.length > 0 && <div className="mt-5"><p className="mb-3 text-xs font-semibold text-muted-foreground">Similar skills to consider</p><div className="flex flex-wrap gap-2">{related.map((skill) => <button type="button" key={skill.id} disabled={disabled || adding} aria-pressed={chosen.has(skill.id)} className={`onboarding-chip ${chosen.has(skill.id) ? "onboarding-selected" : ""}`} onClick={() => onChange(chosen.has(skill.id) ? selected.filter((row) => row.id !== skill.id) : [...selected, { id: skill.id, name: skill.name, proficiency: "" }])}>{chosen.has(skill.id) ? "✓" : "+"} {skill.name}</button>)}</div></div>}
      {onCreate && <div className="mt-6 border-t border-border pt-4">
        <button type="button" className="text-sm font-semibold text-functional-teal underline underline-offset-4" onClick={() => setCustom(!custom)} disabled={disabled || adding}>Can’t find your skill? Add it</button>
        {custom && <div className="mt-4 space-y-4 rounded-xl bg-secondary/60 p-4">
          <p className="text-sm">Your new skill will be available for other students to select immediately. Check the search results for similar skills first.</p>
          <label className="block text-sm">Skill name<Input value={search} onChange={(e) => setSearch(e.target.value)} maxLength={80} disabled={adding} className="mt-1 bg-white" /></label>
          <label className="block text-sm">Category<select className="onboarding-input mt-1" value={customFamily} onChange={(e) => setCustomFamily(e.target.value)} disabled={adding}><option value="">Choose a category</option>{catalogues.families.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
          <label className="block text-sm">Your level<select className="onboarding-input mt-1" value={customLevel} onChange={(e) => setCustomLevel(e.target.value)} disabled={adding}><option value="">Choose your level</option>{levels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select></label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="button" disabled={adding || disabled} onClick={create}>{adding ? "Adding…" : "Add skill to my profile"}</Button>
        </div>}
      </div>}
    </div>
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-7">
      <h2 className="font-semibold text-primary">{needs ? "Skills your team needs" : "Your selected skills"} <span className="ml-2 rounded-full bg-accent px-2 py-1 text-xs text-functional-teal">{selected.length}</span></h2>
      {!selected.length && <p className="mt-4 text-sm text-muted-foreground">Select at least one skill above to continue.</p>}
      <div className="mt-5 space-y-3">
        {selected.map((skill) => <div key={skill.id} className="rounded-xl bg-secondary/60 p-4">
          <div className="flex items-start justify-between gap-3"><span className="font-medium">{skill.name}</span><button type="button" aria-label={`Remove ${skill.name}`} disabled={disabled || adding} onClick={() => onChange(selected.filter((row) => row.id !== skill.id))} className="shrink-0 text-xs underline">Remove</button></div>
          {!needs && <fieldset disabled={disabled || adding} className="mt-3"><legend className="mb-2 text-xs text-muted-foreground">How comfortable are you with this skill?</legend><div className="flex flex-wrap gap-2">{levels.map((level) => <label key={level.value} className={`onboarding-chip cursor-pointer ${skill.proficiency === level.value ? "onboarding-selected" : ""}`} title={level.description}><input type="radio" className="accent-functional-teal" name={`level-${skill.id}`} value={level.value} checked={skill.proficiency === level.value} onChange={() => onChange(selected.map((row) => row.id === skill.id ? { ...row, proficiency: level.value } : row))} />{level.label}</label>)}{skill.proficiency === "EXPERT" && <span className="onboarding-chip onboarding-selected">Expert · saved level</span>}</div></fieldset>}
        </div>)}
      </div>
      {!needs && <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Learning: building the basics. Practising: contributing with some support. Experienced: working independently. These are self-reported levels.</p>}
    </div>
  </div>;
}
