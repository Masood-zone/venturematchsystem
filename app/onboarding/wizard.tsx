"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { accountDestinationKey } from "@/hooks/auth/use-account-entry";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Brand, SiteFooter } from "@/components/common/site-shell";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SkillPicker, {
  type Selection,
} from "@/components/onboarding/skill-picker";
import { useLogOut } from "@/hooks/auth/use-auth";
import {
  levels,
  readDraft,
  stepDraftSchema,
  stepSchema,
  stepsFor,
  type Goal,
  type Step,
} from "@/lib/onboarding";
import type { OnboardingState } from "@/services/onboarding/service";
import { studentDestination } from "@/lib/student-destination";
import { completedEntry, type EntryContext } from "@/lib/student-entry";
import ProfileIntroductions from "@/components/onboarding/profile-introductions";

async function request<T>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    cache: "no-store",
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error ?? "Unable to save your setup. Please retry.");
  return result as T;
}
export default function OnboardingWizard({ name, userId, context }: { name: string; userId: string; context: EntryContext }) {
  const query = useQuery({
    queryKey: ["onboarding", userId],
    queryFn: () => request<OnboardingState>("/api/onboarding"),
    retry: false,
    staleTime: 0,
  });
  if (query.isPending)
    return (
      <main id="main-content" className="mx-auto max-w-4xl p-8" role="status">
        Loading your saved setup…
      </main>
    );
  if (query.isError)
    return (
      <main id="main-content" className="mx-auto max-w-xl space-y-4 p-8">
        <h1 className="text-2xl font-bold">Your setup couldn’t load</h1>
        <p role="alert">{query.error.message}</p>
        <Button onClick={() => query.refetch()}>Try again</Button>
        <Link className="ml-5 underline" href="/explore">
          Browse ventures
        </Link>
      </main>
    );
  if (query.data.completed)
    return (
      <main id="main-content" className="mx-auto max-w-xl space-y-4 p-8">
        <h1 className="text-2xl font-bold">Your setup is complete</h1>
        <p>
          Your student setup is complete. Your ideas stay private until you
          publish them.
        </p>
        <Link className="primary-link px-5 py-3" href={completedEntry(context, studentDestination({ onboardingCompleted: true, onboardingGoal: query.data.goal }))}>
          {context.ventureId ? "Return to venture" : (context.goal ?? query.data.goal) === "BUILD_IDEA" ? "Go to My Ventures" : "Explore opportunities"}
        </Link>
        {query.data.idea && (
          <Link
            className="ml-4 underline"
            href={`/ventures/${query.data.idea.id}`}
          >
            View my idea
          </Link>
        )}
      </main>
    );
  return <WizardEditor key={userId} initial={query.data} name={name} context={context} />;
}

const titles: Record<Step, string> = {
  goal: "What would you like to do first?",
  idea: "Capture your idea privately",
  skills: "What can you contribute?",
  interests: "What would you like to work on?",
  needs: "Who would help bring your idea to life?",
  review: "Make it yours. Then get started.",
};
const descriptions: Record<Step, string> = {
  goal: "Choose where you want to begin. You can join teams and build your own ideas from the same account.",
  idea: "An early thought is enough. Your draft stays visible only to you until you explicitly publish it.",
  skills:
    "Choose skills you already use—from classes, work, hobbies, or personal projects. You can choose skills from any field.",
  interests:
    "Choose the areas that interest you and the time you can realistically give alongside your studies.",
  needs:
    "Choose the skills you need from collaborators. These are separate from your own skills.",
  review:
    "Check your profile and choose what other students can see. You can go back to make changes.",
};
function WizardEditor({
  initial,
  name,
  context,
}: {
  initial: OnboardingState;
  name: string;
  context: EntryContext;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useLogOut();
  const [saved, setSaved] = useState(initial);
  const ideaDraft = readDraft(initial.drafts, "idea");
  const skillsDraft = readDraft(initial.drafts, "skills");
  const interestDraft = readDraft(initial.drafts, "interests");
  const needsDraft = readDraft(initial.drafts, "needs");
  const [goal, setGoal] = useState<Goal | "">(
    readDraft(initial.drafts, "goal")?.goal ?? (initial.goal === "BUILD_IDEA" || initial.goal === "JOIN_TEAM"
      ? initial.goal
      : context.goal ?? ""),
  );
  const initialSteps = stepsFor(initial.goal);
  const [step, setStep] = useState<Step>(
    initialSteps.includes(initial.step as Step)
      ? (initial.step as Step)
      : "goal",
  );
  const [skills, setSkills] = useState<Selection[]>(skillsDraft ? skillsDraft.skills.map((skill) => ({ ...skill, name: initial.catalogues.skills.find((row) => row.id === skill.id)?.name ?? initial.skills.find((row) => row.id === skill.id)?.name ?? "Unavailable skill" })) : initial.skills);
  const [sectorIds, setSectorIds] = useState(interestDraft?.sectorIds ?? initial.sectorIds);
  const [hours, setHours] = useState(interestDraft?.weeklyHoursBand ?? initial.weeklyHoursBand);
  const [title, setTitle] = useState(ideaDraft?.title ?? initial.idea?.title ?? "");
  const [problem, setProblem] = useState(ideaDraft?.problem ?? initial.idea?.problem ?? "");
  const [audience, setAudience] = useState(ideaDraft?.targetUsers ?? initial.idea?.targetUsers ?? "");
  const [ideaSector, setIdeaSector] = useState(ideaDraft?.sectorId ?? initial.idea?.sectorId ?? "");
  const [needs, setNeeds] = useState<Selection[]>(
    (needsDraft?.capabilityIds ?? initial.idea?.capabilityIds ?? []).map((id) => ({
      id,
      name:
        initial.catalogues.skills.find((skill) => skill.id === id)?.name ??
        "Unavailable skill",
      proficiency: "",
    })),
  );
  const [contribution, setContribution] = useState(
    needsDraft?.contribution ?? initial.idea?.contribution ?? "",
  );
  const reviewDraft = readDraft(initial.drafts, "review");
  const [contributionIntro, setContributionIntro] = useState(reviewDraft?.contributionIntro ?? initial.contributionIntro);
  const [teamGoals, setTeamGoals] = useState(reviewDraft?.teamGoals ?? initial.teamGoals);
  const [visible, setVisible] = useState(initial.discoverability);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [publish, setPublish] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const steps = stepsFor(step === "goal" ? goal || null : saved.goal);
  const index = steps.indexOf(step);
  const catalogues = saved.catalogues;
  function navigate(next: Step) {
    setStep(next);
    setError("");
    setPublish(false);
    requestAnimationFrame(() => {
      heading.current?.focus();
      heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
  function payload() {
    switch (step) {
      case "goal":
        return { step, goal };
      case "idea":
        return {
          step,
          title,
          problem,
          targetUsers: audience,
          sectorId: ideaSector,
        };
      case "skills":
        return {
          step,
          skills: skills.map(({ id, proficiency }) => ({ id, proficiency })),
        };
      case "interests":
        return { step, sectorIds, weeklyHoursBand: hours };
      case "needs":
        return {
          step,
          capabilityIds: needs.map((skill) => skill.id),
          contribution,
        };
      case "review":
        return { step, discoverability: visible, contributionIntro, teamGoals };
    }
  }
  async function save(exit = false) {
    if (busy) return;
    setError("");
    const parsed = (exit ? stepDraftSchema : stepSchema).safeParse(payload());
    if (!parsed.success) {
      setError(
        step === "skills"
          ? "Select at least one skill and choose a level for each."
          : step === "goal"
            ? "Choose where you want to start."
            : "Complete the required fields before saving this step.",
      );
      return;
    }
    setBusy(true);
    try {
      const next = await request<OnboardingState>(
        "/api/onboarding/steps",
        "PUT",
        { data: parsed.data, advance: !exit },
      );
      setSaved(next);
      if (exit) router.push("/explore");
      else navigate(next.step as Step);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function complete(publishIdea: boolean) {
    setBusy(true);
    setError("");
    try {
      const result = await request<{
        destination: string;
        ventureId: string | null;
      }>("/api/onboarding/complete", "POST", {
        discoverability: visible,
        publish: publishIdea,
        contributionIntro, teamGoals,
      });
      void queryClient.invalidateQueries({ queryKey: accountDestinationKey });
      router.replace(completedEntry(context, result.destination));
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to finish. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === "review") void complete(false);
    else void save();
  }
  return (
    <>
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8">
          <Brand />
          <div className="flex items-center gap-5 text-sm">
            <Link href="/explore" className="hover:text-functional-teal">
              Browse ventures
            </Link>
            <span className="hidden text-muted-foreground md:inline">
              {name}
            </span>
            <button
              type="button"
              disabled={busy || logout.isPending}
              onClick={() => logout.mutate()}
              className="text-muted-foreground underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 sm:py-12"
      >
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 text-xs">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">
            Student onboarding <span className="mx-2">·</span>{" "}
            <span className="text-functional-teal">
              Step {index + 1} of {steps.length}
            </span>
          </span>
          <span className="text-muted-foreground">
            USTED Kumasi · Your own starting point
          </span>
        </div>
        <progress
          value={index + 1}
          max={steps.length}
          aria-label="Onboarding progress"
          className="onboarding-progress mb-8 h-1.5 w-full"
        />
        {index > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => navigate(steps[index - 1])}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-functional-teal"
          >
            <MaterialSymbol icon="arrow_back" className="text-lg" />
            Back
          </button>
        )}
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
          <form
            onSubmit={submit}
            noValidate
            className="min-w-0 space-y-7"
            aria-busy={busy}
          >
            <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-functional-teal">
                <MaterialSymbol
                  icon={
                    step === "idea" || step === "needs" ? "lock" : "explore"
                  }
                  className="text-lg"
                />
                {step === "idea" || step === "needs"
                  ? "Private idea sandbox"
                  : "Your student profile"}
              </p>
              <h1
                ref={heading}
                tabIndex={-1}
                className="scroll-mt-8 text-3xl leading-tight font-bold tracking-tight text-primary sm:text-4xl"
              >
                {titles[step]}
              </h1>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {descriptions[step]}
              </p>
            </div>
            <fieldset disabled={busy} className="min-w-0 space-y-6">
              {step === "goal" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      {
                        value: "JOIN_TEAM",
                        title: "Find a team to join",
                        icon: "group_add",
                        text: "Bring your skills to a student venture. Explore opportunities across every field and find a contribution that fits you.",
                        items: [
                          "Explore student opportunities",
                          "Contribute skills you already use",
                          "Meet students across disciplines",
                        ],
                      },
                      {
                        value: "BUILD_IDEA",
                        title: "Build my idea",
                        icon: "lightbulb",
                        text: "Start with a problem you want to solve. Save your idea privately and describe the help you need to move it forward.",
                        items: [
                          "Start with a private draft",
                          "No formal business plan needed",
                          "Choose when to publish",
                        ],
                      },
                    ] as const
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-2xl border-2 bg-white p-6 transition-colors ${goal === option.value ? "border-functional-teal bg-accent/30" : "border-transparent hover:border-border"}`}
                    >
                      <div className="flex items-center justify-between">
                        <MaterialSymbol
                          icon={option.icon}
                          className="rounded-xl bg-secondary p-3 text-3xl text-functional-teal"
                        />
                        <input
                          type="radio"
                          name="goal"
                          value={option.value}
                          checked={goal === option.value}
                          onChange={() => setGoal(option.value)}
                          className="size-5 accent-functional-teal"
                        />
                      </div>
                      <h2 className="mt-6 text-xl font-semibold text-primary">
                        {option.title}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {option.text}
                      </p>
                      <ul className="mt-6 space-y-3 text-xs">
                        {option.items.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="text-functional-teal">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </label>
                  ))}
                </div>
              )}
              {step === "idea" && (
                <div className="space-y-5 rounded-2xl border border-border bg-white p-6 sm:p-8">
                  <label className="onboarding-label">
                    Working title{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional until publishing)
                    </span>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      className="auth-input mt-2"
                      placeholder="Give your idea a working name"
                    />
                  </label>
                  <label className="onboarding-label">
                    Problem or opportunity <span aria-hidden="true">*</span>
                    <textarea
                      required
                      maxLength={500}
                      rows={5}
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                      className="onboarding-input mt-2 resize-y"
                      placeholder="What problem have you noticed, and why does it matter?"
                    />
                    <span className="mt-1 block text-right text-xs font-normal text-muted-foreground">
                      {problem.length}/500
                    </span>
                  </label>
                  <label className="onboarding-label">
                    Who is this for? <span aria-hidden="true">*</span>
                    <textarea
                      required
                      maxLength={300}
                      rows={3}
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="onboarding-input mt-2 resize-y"
                      placeholder="Describe the people who would benefit"
                    />
                  </label>
                  <label className="onboarding-label">
                    Main venture area <span aria-hidden="true">*</span>
                    <select
                      required
                      value={ideaSector}
                      onChange={(e) => setIdeaSector(e.target.value)}
                      className="onboarding-input mt-2"
                    >
                      <option value="">Choose an area</option>
                      {catalogues.sectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              {step === "skills" && (
                <SkillPicker
                  catalogues={catalogues}
                  selected={skills}
                  onChange={setSkills}
                  disabled={busy}
                  onCreate={async (input) => {
                    setBusy(true);
                    try {
                    const skill = await request<
                      OnboardingState["catalogues"]["skills"][number]
                    >("/api/onboarding/skills", "POST", input);
                    setSaved((previous) => ({
                      ...previous,
                      catalogues: {
                        ...previous.catalogues,
                        skills: previous.catalogues.skills.some(
                          (row) => row.id === skill.id,
                        )
                          ? previous.catalogues.skills
                          : [...previous.catalogues.skills, skill],
                      },
                    }));
                    return skill;
                    } finally { setBusy(false); }
                  }}
                />
              )}
              {step === "interests" && (
                <div className="space-y-8 rounded-2xl border border-border bg-white p-6 sm:p-8">
                  <fieldset>
                    <legend className="mb-4 font-semibold text-primary">
                      Venture interests · choose one or more
                    </legend>
                    {sectorIds.some((id) => !catalogues.sectors.some((sector) => sector.id === id)) && <p role="alert" className="mb-4 text-sm text-destructive">A saved interest is no longer available. <button type="button" className="underline" onClick={() => setSectorIds(sectorIds.filter((id) => catalogues.sectors.some((sector) => sector.id === id)))}>Remove unavailable interests</button>, then choose from the current list.</p>}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {catalogues.sectors.map((sector) => (
                        <label
                          key={sector.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm ${sectorIds.includes(sector.id) ? "border-functional-teal bg-accent/50" : "border-border"}`}
                        >
                          <input
                            type="checkbox"
                            className="size-4 accent-functional-teal"
                            checked={sectorIds.includes(sector.id)}
                            onChange={(e) =>
                              setSectorIds(
                                e.target.checked
                                  ? [...sectorIds, sector.id]
                                  : sectorIds.filter((id) => id !== sector.id),
                              )
                            }
                          />
                          {sector.name}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend className="mb-2 font-semibold text-primary">
                      How much time can you give each week?
                    </legend>
                    <p className="mb-4 text-sm text-muted-foreground">
                      An estimate is enough. Choose what fits your schedule.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {catalogues.availability.map((option) => (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm ${hours === option.id ? "border-functional-teal bg-accent/50" : "border-border"}`}
                        >
                          <input
                            type="radio"
                            name="availability"
                            value={option.id}
                            checked={hours === option.id}
                            onChange={() => setHours(option.id)}
                            className="size-4 accent-functional-teal"
                          />
                          {option.label} / week
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}
              {step === "needs" && (
                <>
                  <SkillPicker
                    needs
                    catalogues={catalogues}
                    selected={needs}
                    onChange={setNeeds}
                    disabled={busy}
                  />
                  <label className="onboarding-label rounded-2xl border border-border bg-white p-6">
                    What would you like collaborators to help with?{" "}
                    <span aria-hidden="true">*</span>
                    <textarea
                      required
                      maxLength={1000}
                      rows={4}
                      value={contribution}
                      onChange={(e) => setContribution(e.target.value)}
                      className="onboarding-input mt-3"
                      placeholder="Describe a practical contribution, such as researching users or building a first prototype."
                    />
                  </label>
                </>
              )}
              {step === "review" && (
                <>
                  <section className="space-y-5 rounded-2xl border border-border bg-white p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-primary">
                      Your student profile
                    </h2>
                    <p className="font-semibold">{name}</p>
                    {saved.programme && (
                      <p className="text-sm text-muted-foreground">
                        {saved.programme}
                      </p>
                    )}
                    <ul className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <li className="onboarding-chip" key={skill.id}>
                          {skill.name} ·{" "}
                          {levels.find(
                            (level) => level.value === skill.proficiency,
                          )?.label ?? "Expert"}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm leading-7">
                      {sectorIds
                        .map(
                          (id) =>
                            catalogues.sectors.find(
                              (sector) => sector.id === id,
                            )?.name ?? "Unavailable interest",
                        )
                        .join(" · ")}
                    </p>
                    <p className="text-sm">
                      {catalogues.availability.find(
                        (option) => option.id === hours,
                      )?.label ?? "Choose availability"}{" "}
                      per week
                    </p>
                    <ProfileIntroductions contributionIntro={contributionIntro} teamGoals={teamGoals} onContributionChange={setContributionIntro} onGoalsChange={setTeamGoals} />
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-secondary/60 p-4">
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={(e) => setVisible(e.target.checked)}
                        className="mt-1 size-4 shrink-0 accent-functional-teal"
                      />
                      <span className="text-sm">
                        <strong className="block">
                          Let other students discover my profile
                        </strong>
                        <span className="mt-2 block leading-6 text-muted-foreground">
                          Share my name, programme, skills and levels,
                          interests, and availability with signed-in students.
                          My email and private ideas stay hidden. Turn this off
                          to finish with a hidden profile.
                        </span>
                      </span>
                    </label>
                  </section>
                  {goal === "BUILD_IDEA" && (
                    <section className="space-y-4 rounded-2xl border border-border bg-white p-6 sm:p-8">
                      <p className="text-xs font-semibold uppercase tracking-wider text-functional-teal">
                        Recruitment preview · currently private
                      </p>
                      <h2 className="text-2xl font-semibold text-primary">
                        {title || "Untitled idea"}
                      </h2>
                      <p className="text-sm font-medium">
                        By {name} ·{" "}
                        {
                          catalogues.sectors.find(
                            (sector) => sector.id === ideaSector,
                          )?.name
                        }
                      </p>
                      <p className="text-sm leading-7 whitespace-pre-wrap">
                        {problem}
                      </p>
                      <p className="text-sm leading-7">
                        <strong>For:</strong> {audience}
                      </p>
                      <p className="text-sm leading-7 whitespace-pre-wrap">
                        <strong>Help needed:</strong> {contribution}
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {needs.map((skill) => (
                          <li className="onboarding-chip" key={skill.id}>
                            {skill.name}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm">
                        {
                          catalogues.availability.find(
                            (option) => option.id === hours,
                          )?.label
                        }{" "}
                        per week
                      </p>
                      <p className="text-xs leading-6 text-muted-foreground">
                        Publishing shares this brief and your name with
                        signed-in students, even if your profile is hidden. It
                        does not create a team or invite anyone.
                      </p>
                      {!title.trim() && (
                        <p className="text-sm text-muted-foreground">
                          To publish now, go back to your idea and add a title.
                          You can still finish with a private draft.
                        </p>
                      )}
                    </section>
                  )}
                </>
              )}
            </fieldset>
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/30 bg-white p-4 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            {publish && (
              <div
                className="space-y-4 rounded-2xl border border-functional-teal bg-accent p-5"
                role="region"
                aria-label="Confirm publication"
              >
                <p className="text-sm leading-6">
                  Publish this recruitment brief to signed-in students? Your
                  project title, problem, audience, needed skills, contribution
                  description, weekly hours and name will become visible.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => complete(true)}
                  >
                    Confirm and publish
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setPublish(false)}
                  >
                    Keep editing
                  </Button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
              <button
                type="button"
                onClick={() => save(true)}
                disabled={busy}
                className="text-sm font-semibold text-functional-teal underline underline-offset-4"
              >
                Save and exit
              </button>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={busy}
                  className="h-12 rounded-xl px-6"
                >
                  {busy
                    ? "Saving…"
                    : step === "review"
                      ? goal === "BUILD_IDEA"
                        ? "Finish with private draft"
                        : "Finish and explore"
                      : "Continue"}
                  {!busy && (
                    <MaterialSymbol
                      icon="arrow_forward"
                      className="ml-2 text-lg"
                    />
                  )}
                </Button>
                {step === "review" && goal === "BUILD_IDEA" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-xl"
                    disabled={busy || !title.trim()}
                    onClick={() => setPublish(true)}
                  >
                    Finish and publish opportunity
                  </Button>
                )}
              </div>
            </div>
          </form>
          <aside className="space-y-5 lg:sticky lg:top-8">
            <div className="rounded-2xl border border-border bg-white p-6">
              <MaterialSymbol
                icon={goal === "BUILD_IDEA" ? "lock" : "diversity_3"}
                className="mb-4 text-3xl text-functional-teal"
              />
              <h2 className="text-lg font-semibold text-primary">
                {goal === "BUILD_IDEA"
                  ? "Your idea, at your pace"
                  : "More than your programme"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {goal === "BUILD_IDEA"
                  ? "Keep your concept private while you shape it. You decide when other students can see your recruitment brief."
                  : "Your skills can come from anywhere. Add practical, creative, technical and people skills from inside or outside your course."}
              </p>
            </div>
            <div className="rounded-2xl bg-accent/70 p-6">
              <h2 className="text-sm font-semibold text-functional-teal">
                A flexible starting point
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                You can build your own idea and join another team with this
                account. This choice only sets your first steps.
              </p>
              <Link
                href="/explore"
                className="mt-4 inline-block text-sm font-semibold text-functional-teal underline"
              >
                Browse now, finish setup later
              </Link>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Your unfinished profile stays hidden. Continue or save before
                leaving to keep changes on this step.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter auth />
    </>
  );
}
