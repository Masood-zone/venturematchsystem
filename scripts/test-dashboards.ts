import assert from "node:assert/strict";
import test from "node:test";
import { activeOwnedVentureWhere, studentAccountStatus, studentDestination } from "../lib/student-destination";
import { completedEntry } from "../lib/student-entry";
import { myVentureWhere, parseVentureFilters, publishedVentureWhere } from "../lib/venture-dashboard";

test("unfinished setup always takes precedence over a selected goal", () => {
  assert.equal(studentDestination(null), "/onboarding");
  for (const goal of ["BUILD_IDEA", "JOIN_TEAM", null]) {
    assert.equal(studentDestination({ onboardingCompleted: false, onboardingGoal: goal }), "/onboarding");
  }
});

test("completed students land according to their saved goal, with a safe legacy fallback", () => {
  assert.equal(studentDestination({ onboardingCompleted: true, onboardingGoal: "BUILD_IDEA" }), "/ventures");
  for (const goal of ["JOIN_TEAM", null, "legacy-goal"]) {
    assert.equal(studentDestination({ onboardingCompleted: true, onboardingGoal: goal }), "/explore");
  }
});

test("an active venture owner lands in My Ventures even with a team-seeking goal", () => {
  const profile = { onboardingCompleted: true, onboardingGoal: "JOIN_TEAM" };
  assert.equal(studentAccountStatus(profile, true), "founder");
  assert.equal(studentDestination(profile, true), "/ventures");
  assert.equal(studentAccountStatus(profile, false), "team-seeker");
  assert.equal(studentAccountStatus({ ...profile, onboardingCompleted: false }, true), "setup");
  assert.equal(studentDestination({ ...profile, onboardingCompleted: false }, true), "/onboarding");
});

test("founder eligibility requires active ownership and keeps idea builders distinct", () => {
  assert.deepEqual(activeOwnedVentureWhere("student-id"), { ownerId: "student-id", status: "ACTIVE" });
  assert.equal(studentAccountStatus({ onboardingCompleted: true, onboardingGoal: "BUILD_IDEA" }, false), "builder");
  assert.equal(studentAccountStatus({ onboardingCompleted: true, onboardingGoal: null }, false), "student");
});

test("explicit destinations retain priority over the founder default", () => {
  const founderDestination = studentDestination({ onboardingCompleted: true, onboardingGoal: "JOIN_TEAM" }, true);
  assert.equal(completedEntry({}, founderDestination), "/ventures");
  assert.equal(completedEntry({ goal: "JOIN_TEAM" }, founderDestination), "/explore");
  assert.equal(completedEntry({ ventureId: "venture-1" }, founderDestination), "/ventures/venture-1");
  assert.equal(completedEntry({ trialId: "trial-1" }, founderDestination), "/ventures/trials/trial-1");
  assert.equal(completedEntry({ invitationId: "invite-1" }, founderDestination), "/ventures/invitations/invite-1");
});

test("URL filters handle repeated parameters, whitespace, and bounded input", () => {
  assert.deepEqual(parseVentureFilters({ q: ["  design  ", "ignored"], sector: " sector-a ", hours: "5-10" }), {
    q: "design", sector: "sector-a", hours: "5-10",
  });
  assert.deepEqual(parseVentureFilters({}), { q: "", sector: "", hours: "" });
  assert.equal(parseVentureFilters({ q: "x".repeat(1000) }).q.length, 120);
  assert.equal(parseVentureFilters({ sector: "x".repeat(1000) }).sector.length, 191);
});

test("search and combined filters cannot remove the published-only constraint", () => {
  const where = publishedVentureWhere(parseVentureFilters({ q: "DRAFT", sector: "sector-a", hours: "5-10" }));
  assert.equal(where.status, "ACTIVE");
  assert.equal(where.primarySectorId, "sector-a");
  assert.equal(where.weeklyHoursBand, "5-10");
  assert.ok(Array.isArray(where.OR));
  assert.equal(where.OR.length, 3);
  assert.equal(publishedVentureWhere().status, "ACTIVE");
});

test("My Ventures scopes ownership and membership independently, excluding others' drafts", () => {
  const where = myVentureWhere("signed-in-student");
  assert.deepEqual(where, {
    OR: [
      { ownerId: "signed-in-student" },
      { status: { not: "DRAFT" }, venture_member: { some: { userId: "signed-in-student", status: "ACTIVE" } } },
    ],
  });
});
