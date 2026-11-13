import assert from "node:assert/strict";
import test from "node:test";
import { studentDestination } from "../lib/student-destination";
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
