import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { db } from "../lib/db";
import { auth } from "../services/auth/auth";
import { normalizeSkill, readDraft, stepSchema } from "../lib/onboarding";
import { addSkill, completeOnboarding, loadOnboarding, publishVenture, saveDraft, saveStep } from "../services/onboarding/service";
import { accessibleVenture, discoverableStudents, publishedVentures } from "../services/onboarding/discovery";
import { GET as getOnboarding } from "../app/api/onboarding/route";
import { PUT as putStep } from "../app/api/onboarding/steps/route";
import { GET as getDestination } from "../app/api/auth/destination/route";

test("skill normalization preserves meaningful punctuation and three-level input is explicit", () => {
  assert.equal(normalizeSkill("  WEB　 Development  "), "web development");
  assert.notEqual(normalizeSkill("C"), normalizeSkill("C++"));
  assert.equal(stepSchema.safeParse({ step: "skills", skills: [{ id: "s", proficiency: "" }] }).success, false);
  assert.equal(stepSchema.safeParse({ step: "interests", sectorIds: [], weeklyHoursBand: "5-10" }).success, false);
});

// This is a remote-database integration test, not a unit test. Allow time for
// network round trips across both complete journeys and mandatory cleanup.
test("live onboarding: registration, resume, both paths, privacy, concurrency and publication", { timeout: 600_000 }, async () => {
  const marker = `onboarding-test-${randomUUID()}`;
  const origin = new URL(process.env.BETTER_AUTH_URL!).origin;
  const users: string[] = [];
  const customNames: string[] = [];
  async function register(label: string) {
    const programme = await db.academic_programme.findFirstOrThrow({ where: { active: true, campus: "KUMASI" } });
    const response = await auth.handler(new Request(`${origin}/api/auth/sign-up/email`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ name: `${marker}-${label}`, email: `${marker}-${label}@example.test`, password: `Test-${randomUUID()}!`, programme: programme.name }) }));
    assert.equal(response.status, 200);
    const result = await response.json();
    users.push(result.user.id);
    const cookie = response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    return { id: result.user.id as string, cookie };
  }
  const headers = (cookie: string, withOrigin = true) => ({ Cookie: cookie, "Content-Type": "application/json", ...(withOrigin ? { Origin: origin } : {}) });
  try {
    const first = await register("join");
    const second = await register("idea");
    assert.equal((await getOnboarding(new Request(`${origin}/api/onboarding`))).status, 401);
    let destination = await getDestination(new Request(`${origin}/api/auth/destination`, { headers: headers(first.cookie) }));
    assert.equal((await destination.json()).destination, "/onboarding");
    const denied = await putStep(new Request(`${origin}/api/onboarding/steps`, { method: "PUT", headers: headers(first.cookie, false), body: JSON.stringify({ data: { step: "goal", goal: "JOIN_TEAM" }, advance: true }) }));
    assert.equal(denied.status, 403);
    console.info("Verified registration, session routing and request authorization.");
    let state = await loadOnboarding(first.id);
    const skill = state.catalogues.skills[0];
    const sector = state.catalogues.sectors[0];
    assert.ok(state.programme?.length);
    const response = await putStep(new Request(`${origin}/api/onboarding/steps`, { method: "PUT", headers: headers(first.cookie), body: JSON.stringify({ data: { step: "goal", goal: "JOIN_TEAM" }, advance: true }) }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).step, "skills");
    await assert.rejects(completeOnboarding(first.id, true, false), /skill/i);
    await assert.rejects(saveStep(first.id, { step: "skills", skills: [{ id: "missing-skill", proficiency: "BEGINNER" }] }, true), /no longer available/);
    assert.equal((await loadOnboarding(first.id)).step, "skills");
    await saveStep(first.id, { step: "skills", skills: [{ id: skill.id, proficiency: "BEGINNER" }] }, false);
    assert.equal((await loadOnboarding(first.id)).step, "skills");
    await saveStep(first.id, { step: "interests", sectorIds: [sector.id], weeklyHoursBand: "5-10" }, true);
    assert.ok(!(await discoverableStudents()).some((row) => row.user.name.startsWith(marker)));
    await completeOnboarding(first.id, false, false);
    await completeOnboarding(first.id, false, false);
    assert.ok(!(await discoverableStudents()).some((row) => row.user.name.startsWith(marker)));
    destination = await getDestination(new Request(`${origin}/api/auth/destination`, { headers: headers(first.cookie) }));
    assert.equal((await destination.json()).destination, "/explore");
    console.info("Verified join-team completion, resume, opt-out and idempotency.");

    await saveStep(second.id, { step: "goal", goal: "BUILD_IDEA" }, true);
    state = await saveStep(second.id, { step: "idea", title: "", problem: "A test problem", targetUsers: "Test students", sectorId: sector.id }, true);
    assert.ok(state.idea);
    const incomplete = await saveDraft(second.id, { step: "idea", title: "Unfinished draft title", problem: "", targetUsers: "", sectorId: "" });
    assert.equal(readDraft(incomplete.drafts, "idea")?.title, "Unfinished draft title");
    assert.equal(incomplete.idea?.problem, "A test problem");
    state = await saveStep(second.id, { step: "idea", title: "", problem: "A test problem", targetUsers: "Test students", sectorId: sector.id }, true);
    assert.ok(state.idea);
    assert.equal(await accessibleVenture(state.idea.id, first.id), null);
    assert.ok(!(await publishedVentures()).some((row) => row.id === state.idea!.id));
    await saveStep(second.id, { step: "goal", goal: "JOIN_TEAM" }, true);
    assert.equal((await loadOnboarding(second.id)).idea?.id, state.idea.id);
    await saveStep(second.id, { step: "goal", goal: "BUILD_IDEA" }, true);
    const name = `${marker} skill`;
    customNames.push(name);
    const results = await Promise.all([
      addSkill(second.id, { name, familyId: state.catalogues.families[0].id, proficiency: "INTERMEDIATE" }),
      addSkill(second.id, { name: ` ${name.toUpperCase()} `, familyId: state.catalogues.families[0].id, proficiency: "INTERMEDIATE" }),
    ]);
    assert.equal(results[0].id, results[1].id);
    assert.equal(await db.capability.count({ where: { normalizedName: normalizeSkill(name) } }), 1);
    assert.equal((await loadOnboarding(first.id)).catalogues.skills.some((row) => row.id === results[0].id), true);
    const created = await db.capability.findUniqueOrThrow({ where: { id: results[0].id } });
    assert.equal(created.createdById, second.id);
    console.info("Verified private draft recovery, goal switching and concurrent custom skills.");
    await saveStep(second.id, { step: "interests", sectorIds: [sector.id], weeklyHoursBand: "11-15" }, true);
    await saveStep(second.id, { step: "needs", capabilityIds: [skill.id], contribution: "Help build and evaluate the prototype." }, true);
    await assert.rejects(completeOnboarding(second.id, true, true), /title/);
    assert.equal((await loadOnboarding(second.id)).completed, false);
    assert.equal((await db.venture.findUniqueOrThrow({ where: { id: state.idea.id } })).status, "DRAFT");
    assert.equal((await completeOnboarding(second.id, true, false)).destination, "/ventures");
    assert.equal((await completeOnboarding(second.id, true, false)).destination, "/ventures");
    destination = await getDestination(new Request(`${origin}/api/auth/destination`, { headers: headers(second.cookie) }));
    assert.equal((await destination.json()).destination, "/ventures");
    assert.ok((await discoverableStudents()).some((row) => row.user.name === `${marker}-idea`));
    const publicProfile = (await discoverableStudents()).find((row) => row.user.name === `${marker}-idea`)!;
    assert.ok(!("email" in publicProfile.user));
    assert.ok(!("onboardingVenture" in publicProfile));
    await assert.rejects(publishVenture(first.id, state.idea.id), /not found/i);
    await db.venture.update({ where: { id: state.idea.id }, data: { name: "Integration test opportunity" } });
    await publishVenture(second.id, state.idea.id);
    await publishVenture(second.id, state.idea.id);
    assert.ok(await accessibleVenture(state.idea.id, first.id));
    assert.ok((await publishedVentures()).some((row) => row.id === state.idea!.id));
    await assert.rejects(saveStep(second.id, { step: "goal", goal: "JOIN_TEAM" }, true), /already complete/);
    console.info("Verified private completion, public field filtering and owner-only publication.");
  } finally {
    // Delete only records created by this test; clear the onboarding relation first.
    await db.student_profile.updateMany({ where: { userId: { in: users } }, data: { onboardingVentureId: null } });
    // A step can commit successfully before the subsequent state read fails.
    // Clean all drafts belonging to these test-only users, including that case.
    await db.venture.deleteMany({ where: { ownerId: { in: users } } });
    await db.user.deleteMany({ where: { id: { in: users }, name: { startsWith: marker } } });
    await db.capability.deleteMany({ where: { normalizedName: { in: customNames.map(normalizeSkill) } } });
    await db.$disconnect();
  }
});
