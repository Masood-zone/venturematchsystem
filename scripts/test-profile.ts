import assert from "node:assert/strict";
import test from "node:test";
import type { PrismaClient } from "../lib/generated/prisma/client";
import type { lockProfile } from "../services/onboarding/service";
import { profileSchema } from "../lib/student-profile";
import { createProfileService } from "../services/ventures/profile-service";

const input = profileSchema.parse({
  skills: [{ id: "research", proficiency: "INTERMEDIATE" }], sectorIds: ["education"],
  weeklyHoursBand: "5-10", discoverability: false, contributionIntro: "I can research", teamGoals: "A small team",
});
function setup() {
  let profile: Record<string, unknown> = { onboardingCompleted: true, onboardingGoal: "BUILD_IDEA", onboardingVentureId: "private-idea", discoverability: true };
  let skills: unknown[] = [];
  let interests: unknown[] = [];
  let hours: unknown = null;
  let completed = true;
  let retired = false;
  let fail = false;
  let expert = false;
  const tx = {
    availability_option: { count: async () => retired ? 0 : 1 },
    student_capability: { upsert: async (data: unknown) => { skills.push(data); }, deleteMany: async () => undefined },
    student_venture_interest: { upsert: async (data: unknown) => { interests.push(data); }, deleteMany: async () => undefined },
    student_availability: { upsert: async (data: unknown) => { hours = data; } },
    student_profile: { update: async ({ data }: { data: Record<string, unknown> }) => { if (fail) throw new Error("Injected save failure"); profile = { ...profile, ...data }; } },
  };
  const database = { $transaction: async (operation: (value: typeof tx) => Promise<unknown>) => {
    const before = structuredClone({ profile, skills, interests, hours });
    try { return await operation(tx); }
    catch (error) { profile = before.profile; skills = before.skills; interests = before.interests; hours = before.hours; throw error; }
  } };
  const profileLocker: typeof lockProfile = async () => ({
    id: "student-profile", onboardingCompleted: completed,
    student_capability: expert ? [{ capabilityId: "research", proficiency: "EXPERT" }] : [],
  } as unknown as Awaited<ReturnType<typeof lockProfile>>);
  return {
    save: createProfileService(database as unknown as PrismaClient, { lockProfile: profileLocker, activeSkills: async () => undefined, activeSectors: async () => undefined }),
    state: () => ({ profile, skills, interests, hours }),
    incomplete: () => { completed = false; }, retired: () => { retired = true; }, fail: () => { fail = true; }, expert: () => { expert = true; },
  };
}

test("profile editing saves skills and preferences without resetting setup or private ideas", async () => {
  const { save, state } = setup();
  assert.deepEqual(await save("student", input), { saved: true });
  const result = state();
  assert.equal(result.profile.onboardingCompleted, true);
  assert.equal(result.profile.onboardingGoal, "BUILD_IDEA");
  assert.equal(result.profile.onboardingVentureId, "private-idea");
  assert.equal(result.profile.discoverability, false);
  assert.equal(result.profile.contributionIntro, "I can research");
  assert.equal(result.profile.teamGoals, "A small team");
  assert.equal(result.skills.length, 1); assert.equal(result.interests.length, 1); assert.ok(result.hours);
});

test("unfinished setup and retired availability cannot be saved through profile editing", async () => {
  const incomplete = setup(); incomplete.incomplete();
  await assert.rejects(incomplete.save("student", input), /Finish onboarding/);
  const retired = setup(); retired.retired();
  await assert.rejects(retired.save("student", input), /available weekly time/);
  assert.equal(retired.state().skills.length, 0);
});

test("saved Expert levels remain valid while new Expert claims are rejected", async () => {
  const expertInput = { ...input, skills: [{ id: "research", proficiency: "EXPERT" as const }] };
  const existing = setup(); existing.expert();
  await existing.save("student", expertInput);
  const added = setup();
  await assert.rejects(added.save("student", expertInput), /for a new skill/);
});

test("a failed profile save rolls back all skill, interest and availability writes", async () => {
  const adapter = setup(); adapter.fail();
  const before = structuredClone(adapter.state());
  await assert.rejects(adapter.save("student", input), /Injected save failure/);
  assert.deepEqual(adapter.state(), before);
});
