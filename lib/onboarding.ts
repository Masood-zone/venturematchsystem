import { z } from "zod";
import { introductionsSchema } from "./venture-applications";

export const goals = ["JOIN_TEAM", "BUILD_IDEA"] as const;
export type Goal = (typeof goals)[number];
export type Step = "goal" | "idea" | "skills" | "interests" | "needs" | "review";
export const stepsFor = (goal: string | null): readonly Step[] => goal === "BUILD_IDEA"
  ? ["goal", "idea", "skills", "interests", "needs", "review"] as const
  : ["goal", "skills", "interests", "review"] as const;
export const levels = [
  { value: "BEGINNER", label: "Learning", description: "I am building the basics." },
  { value: "INTERMEDIATE", label: "Practising", description: "I can contribute with some support." },
  { value: "ADVANCED", label: "Experienced", description: "I can work independently." },
] as const;
export const normalizeSkill = (name: string) => name.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
const id = z.string().min(1).max(191);
export const skillName = z.string().trim().min(2, "Use at least 2 characters.").max(80)
  .refine((name) => /[\p{L}\p{N}]/u.test(name) && !/[\p{Cc}\p{Cf}<>]/u.test(name), "Enter a readable skill name.");
export const customSkillSchema = z.object({ name: skillName, familyId: id,
  proficiency: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
});
export const stepSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal("goal"), goal: z.enum(goals) }),
  z.object({ step: z.literal("idea"), title: z.string().trim().max(100), problem: z.string().trim().min(1).max(500), targetUsers: z.string().trim().min(1).max(300), sectorId: id }),
  z.object({ step: z.literal("skills"), skills: z.array(z.object({ id, proficiency: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]) })).min(1).max(100) }),
  z.object({ step: z.literal("interests"), sectorIds: z.array(id).min(1).max(30), weeklyHoursBand: id }),
  z.object({ step: z.literal("needs"), capabilityIds: z.array(id).min(1).max(30), contribution: z.string().trim().min(1).max(1000) }),
  introductionsSchema.extend({ step: z.literal("review"), discoverability: z.boolean() }),
]);
export type StepInput = z.infer<typeof stepSchema>;

// Save-and-exit preserves incomplete inputs; Continue still uses the strict schema.
const draftText = z.string().max(191);
export const stepDraftSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal("goal"), goal: z.union([z.enum(goals), z.literal("")]) }),
  z.object({ step: z.literal("idea"), title: z.string().max(100), problem: z.string().max(500), targetUsers: z.string().max(300), sectorId: draftText }),
  z.object({ step: z.literal("skills"), skills: z.array(z.object({ id, proficiency: z.enum(["", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]) })).max(100) }),
  z.object({ step: z.literal("interests"), sectorIds: z.array(id).max(30), weeklyHoursBand: draftText }),
  z.object({ step: z.literal("needs"), capabilityIds: z.array(id).max(30), contribution: z.string().max(1000) }),
  introductionsSchema.extend({ step: z.literal("review"), discoverability: z.boolean() }),
]);
export type StepDraftInput = z.infer<typeof stepDraftSchema>;
export function parseDrafts(json: string | null | undefined): Record<string, unknown> {
  if (!json) return {};
  try { return z.record(z.string(), z.unknown()).parse(JSON.parse(json)); } catch { return {}; }
}
export function readDraft<K extends Step>(drafts: Record<string, unknown>, step: K) {
  const parsed = stepDraftSchema.safeParse(drafts[step]);
  return parsed.success && parsed.data.step === step ? parsed.data as Extract<StepDraftInput, { step: K }> : undefined;
}

// Prisma query fragments shared by every discovery entry point. Never serialize full users.
export const discoverableStudentWhere = { onboardingCompleted: true, discoverability: true } as const;
export const publicProfileSelect = {
  id: true, academic_profile: { select: { programme: true } },
  user: { select: { name: true } },
  student_capability: { select: { proficiency: true, capability: { select: { id: true, name: true } } } },
  student_venture_interest: { select: { venture_sector: { select: { id: true, name: true } } } },
  student_availability: { select: { weeklyHoursBand: true } },
} as const;
