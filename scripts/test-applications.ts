import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma, PrismaClient } from "../lib/generated/prisma/client";
import type { lockProfile } from "../services/onboarding/service";
import { createApplicationService } from "../services/ventures/application-service";
import { entryContext, entryHref, completedEntry } from "../lib/student-entry";
import { applicationMessageSchema, applicationSubmitSchema, applicationDecision, applicationSnapshotSchema } from "../lib/venture-applications";
import { profileSchema } from "../lib/student-profile";
import { stepSchema, stepDraftSchema } from "../lib/onboarding";

// An isolated transactional adapter exercises the actual service without remote writes.
type Application = Prisma.venture_applicationGetPayload<Record<string, never>>;
type Member = { status: string; membershipType: string };
function setup() {
  const receipts: { userEmail: string; userName: string; ventureName: string }[] = [];
  let row: Application | null = null;
  let member: Member | null = null;
  let status = "ACTIVE";
  let completed = true;
  let failDecision = false;
  let queue: Promise<unknown> = Promise.resolve();
  const venture = () => ({ id: "venture-a", ownerId: "owner", name: "Test venture", status });
  const selected = () => row ? { ...row, venture: { name: "Test venture", status } } : null;
  const tx = {
    $queryRaw: async () => [{ id: "venture-a" }],
    venture: { findUnique: async () => venture() },
    user: { findUniqueOrThrow: async () => ({ name: "Applicant", email: "applicant@example.invalid" }) },
    availability_option: { findUnique: async () => ({ label: "5–10 hours" }) },
    venture_member: {
      findUnique: async () => member,
      upsert: async ({ create, update }: { create: Member; update: Partial<Member> }) => { member = member ? { ...member, ...update } : create; return member; },
    },
    venture_application: {
      findUnique: async ({ where }: { where: { ventureId_applicantUserId?: { ventureId: string; applicantUserId: string } } }) => {
        const key = where.ventureId_applicantUserId;
        return row && (!key || (row.ventureId === key.ventureId && row.applicantUserId === key.applicantUserId)) ? selected() : null;
      },
      findUniqueOrThrow: async () => { assert.ok(row); return selected(); },
      findFirst: async ({ where }: { where: { id: string; ventureId: string } }) => row?.id === where.id && row.ventureId === where.ventureId ? row : null,
      findMany: async ({ where }: { where: { applicantUserId?: string; ventureId?: string } }) => row && (!where.applicantUserId || row.applicantUserId === where.applicantUserId) && (!where.ventureId || row.ventureId === where.ventureId) ? [selected()] : [],
      upsert: async ({ create, update }: { create: Application; update: Partial<Application> }) => { row = row ? { ...row, ...update } : { ...create, updatedAt: new Date() }; return selected(); },
      update: async ({ data }: { data: Partial<Application> }) => { if (failDecision) throw new Error("Injected decision failure"); assert.ok(row); row = { ...row, ...data }; return selected(); },
    },
  };
  const database = {
    ...tx,
    $transaction: (operation: (transaction: typeof tx) => Promise<unknown>) => {
      const result = queue.then(async () => {
        const before = structuredClone({ row, member });
        try { return await operation(tx); }
        catch (error) { row = before.row; member = before.member; throw error; }
      });
      queue = result.catch(() => undefined);
      return result;
    },
  };
  const profileLocker: typeof lockProfile = async () => ({
    onboardingCompleted: completed, discoverability: false,
    academic_profile: { programme: "Design" }, contributionIntro: "I can research", teamGoals: "A practical team",
    student_availability: { weeklyHoursBand: "5-10" },
    student_capability: [{ proficiency: "INTERMEDIATE", capability: { name: "Research" } }],
    student_venture_interest: [{ venture_sector: { name: "Education" } }],
    // Private fields deliberately present: the service must whitelist its snapshot.
    onboardingVenture: { name: "Private idea" }, userId: "applicant", privateEmail: "private@example.invalid",
  } as unknown as Awaited<ReturnType<typeof lockProfile>>);
  const approvals: typeof receipts = [];
  const declines: (typeof receipts[number] & { reason: string })[] = [];
  return {
    service: createApplicationService(database as unknown as PrismaClient, profileLocker, (receipt) => {
      assert.equal(row?.status, "PENDING");
      receipts.push(receipt);
    }, (receipt) => {
      assert.equal(row?.status, "ACCEPTED");
      assert.equal(member?.status, "ACTIVE");
      approvals.push(receipt);
    }, (receipt) => {
      assert.equal(row?.status, "DECLINED");
      declines.push(receipt);
    }),
    approvals,
    declines,
    receipts,
    state: () => ({ row, member }),
    pause: () => { status = "PAUSED"; },
    incomplete: () => { completed = false; },
    failDecision: () => { failDecision = true; },
    seedMember: (value: Member) => { member = value; },
  };
}

test("homepage intent and venture context survive authentication with safe destinations", () => {
  const context = entryContext(new URLSearchParams("goal=JOIN_TEAM&venture=venture-a"));
  assert.equal(entryHref("/login", context), "/login?goal=JOIN_TEAM&venture=venture-a");
  assert.equal(entryHref("/onboarding", context), "/onboarding?goal=JOIN_TEAM&venture=venture-a");
  assert.equal(completedEntry(context, "/ventures"), "/ventures/venture-a");
  assert.equal(completedEntry({ goal: "JOIN_TEAM" }, "/ventures"), "/explore");
  assert.equal(completedEntry({ goal: "BUILD_IDEA" }, "/explore"), "/ventures");
  assert.equal(completedEntry({}, "/ventures"), "/ventures");
  for (const venture of ["//evil.test", "../secrets", "a?next=https://evil.test", "x".repeat(192)])
    assert.deepEqual(entryContext(new URLSearchParams({ goal: "ADMIN", venture })), {});
});

test("legacy review payloads and completed profiles do not require introductions", () => {
  assert.deepEqual(stepSchema.parse({ step: "review", discoverability: false }), { step: "review", discoverability: false, contributionIntro: "", teamGoals: "" });
  assert.deepEqual(stepDraftSchema.parse({ step: "review", discoverability: true, teamGoals: "A team" }), { step: "review", discoverability: true, contributionIntro: "", teamGoals: "A team" });
  const profile = { skills: [{ id: "skill", proficiency: "BEGINNER" }], sectorIds: ["sector"], weeklyHoursBand: "hours", discoverability: false };
  assert.equal(profileSchema.parse(profile).teamGoals, "");
  assert.equal(profileSchema.safeParse({ ...profile, skills: [] }).success, false);
  assert.equal(profileSchema.safeParse({ ...profile, sectorIds: [] }).success, false);
  assert.equal(profileSchema.safeParse({ ...profile, teamGoals: "x".repeat(1001) }).success, false);
  assert.equal(applicationMessageSchema.safeParse({ message: "   " }).success, false);
  assert.equal(applicationMessageSchema.safeParse({ message: "x".repeat(2001) }).success, false);
  assert.equal(applicationSubmitSchema.safeParse({ message: "Hello" }).success, false);
  assert.equal(applicationSubmitSchema.safeParse({ message: "Hello", shareProfile: false }).success, false);
  assert.deepEqual(applicationSubmitSchema.parse({ message: " Hello ", shareProfile: true, applicantUserId: "someone-else" }), { message: "Hello", shareProfile: true });
});

test("submission shares only the whitelisted profile, including for a hidden student", async () => {
  const { service, state } = setup();
  const result = await service.applyToVenture("applicant", "venture-a", "I can help with research.");
  assert.equal(result.status, "PENDING");
  assert.equal(result.snapshot.teamGoals, "A practical team");
  assert.equal(result.snapshot.skills[0].name, "Research");
  assert.equal(state().member, null);
  assert.equal(JSON.stringify(result).includes("Private idea"), false);
  assert.equal(JSON.stringify(result).includes("private@example.invalid"), false);
  assert.ok(applicationSnapshotSchema.safeParse(result.snapshot).success);
  assert.equal((await service.listVentureApplications("owner", "venture-a")).length, 1);
  assert.equal((await service.myApplications("applicant")).length, 1);
  assert.equal((await service.myApplications("stranger")).length, 0);
  await assert.rejects(service.listVentureApplications("stranger", "venture-a"), /not found/);
  assert.equal(await service.ownApplication("stranger", "venture-a"), null);
});

test("incomplete students, owners and active members cannot apply", async () => {
  const incomplete = setup(); incomplete.incomplete();
  await assert.rejects(incomplete.service.applyToVenture("applicant", "venture-a", "Hello"), /Complete your profile/);
  const owned = setup();
  await assert.rejects(owned.service.applyToVenture("owner", "venture-a", "Hello"), /own this venture/);
  const member = setup(); member.seedMember({ status: "ACTIVE", membershipType: "TEAM_MEMBER" });
  await assert.rejects(member.service.applyToVenture("applicant", "venture-a", "Hello"), /already a member/);
  const paused = setup(); paused.pause();
  await assert.rejects(paused.service.applyToVenture("applicant", "venture-a", "Hello"), /not found/);
});

test("duplicate concurrent submissions and approvals are idempotent", async () => {
  const { service, state, receipts, approvals } = setup();
  const [first, duplicate] = await Promise.all([
    service.applyToVenture("applicant", "venture-a", "First message"),
    service.applyToVenture("applicant", "venture-a", "Repeated message"),
  ]);
  assert.equal(first.id, duplicate.id); assert.equal(duplicate.message, "First message");
  assert.deepEqual(receipts, [{ userEmail: "applicant@example.invalid", userName: "Applicant", ventureName: "Test venture" }]);
  assert.equal(JSON.stringify(first).includes("applicant@example.invalid"), false);
  const results = await Promise.all([1, 2].map(() => service.actOnApplication("owner", "venture-a", first.id, "approve")));
  assert.ok(results.every((result) => result.status === "ACCEPTED"));
  assert.equal(state().member?.status, "ACTIVE");
  assert.equal(state().member?.membershipType, "TEAM_MEMBER");
  assert.deepEqual(approvals, [{ userEmail: "applicant@example.invalid", userName: "Applicant", ventureName: "Test venture" }]);
  await assert.rejects(service.actOnApplication("applicant", "venture-a", first.id, "withdraw"), /already been decided/);
});

test("only applicants withdraw and only owners decide; withdrawn requests can be resubmitted", async () => {
  const { service, receipts, approvals, declines } = setup();
  const application = await service.applyToVenture("applicant", "venture-a", "Hello");
  await assert.rejects(service.actOnApplication("stranger", "venture-a", application.id, "approve"), /not found/);
  await assert.rejects(service.actOnApplication("applicant", "venture-a", application.id, "approve"), /cannot change/);
  await assert.rejects(service.actOnApplication("owner", "venture-a", application.id, "withdraw"), /cannot change/);
  await service.actOnApplication("applicant", "venture-a", application.id, "withdraw");
  const resubmitted = await service.applyToVenture("applicant", "venture-a", "Updated message");
  assert.equal(resubmitted.id, application.id); assert.equal(resubmitted.message, "Updated message");
  assert.equal(resubmitted.status, "PENDING"); assert.equal(resubmitted.respondedAt, null);
  assert.equal(receipts.length, 2);
  await assert.rejects(service.actOnApplication("owner", "venture-a", application.id, "decline", " "), /Enter a valid reason/);
  assert.equal((await service.ownApplication("applicant", "venture-a"))?.status, "PENDING");
  await Promise.all([
    service.actOnApplication("owner", "venture-a", application.id, "decline", "  The role has been filled.  "),
    service.actOnApplication("owner", "venture-a", application.id, "decline", "The role has been filled."),
  ]);
  assert.deepEqual(declines, [{ userEmail: "applicant@example.invalid", userName: "Applicant", ventureName: "Test venture", reason: "The role has been filled." }]);
  await assert.rejects(service.applyToVenture("applicant", "venture-a", "Try again"), /already been decided/);
  await assert.rejects(service.actOnApplication("owner", "venture-a", application.id, "approve"), /already been decided/);
  assert.deepEqual(approvals, []);
});

test("paused ventures cannot approve, but pending requests can be declined or withdrawn", async () => {
  const { service, pause, state } = setup();
  const application = await service.applyToVenture("applicant", "venture-a", "Hello"); pause();
  await assert.rejects(service.actOnApplication("owner", "venture-a", application.id, "approve"), /no longer accepting/);
  assert.equal(state().member, null);
  assert.equal((await service.actOnApplication("owner", "venture-a", application.id, "decline", "Recruitment is paused.")).status, "DECLINED");
  assert.equal(applicationDecision("PENDING", "withdraw", false, true, false), "WITHDRAWN");
});

test("approval reactivates a prior membership and failed decisions roll membership back", async () => {
  const normal = setup(); normal.seedMember({ status: "LEFT", membershipType: "TEAM_MEMBER" });
  const first = await normal.service.applyToVenture("applicant", "venture-a", "Hello");
  await normal.service.actOnApplication("owner", "venture-a", first.id, "approve");
  assert.equal(normal.state().member?.status, "ACTIVE");
  const failure = setup();
  const second = await failure.service.applyToVenture("applicant", "venture-a", "Hello"); failure.failDecision();
  await assert.rejects(failure.service.actOnApplication("owner", "venture-a", second.id, "approve"), /Injected decision failure/);
  assert.equal(failure.state().row?.status, "PENDING"); assert.equal(failure.state().member, null);
  assert.deepEqual(failure.approvals, []);
});

test("approval preserves a membership that became active after the application was submitted", async () => {
  const adapter = setup();
  const application = await adapter.service.applyToVenture("applicant", "venture-a", "Hello");
  adapter.seedMember({ status: "ACTIVE", membershipType: "CO_FOUNDER" });
  await adapter.service.actOnApplication("owner", "venture-a", application.id, "approve");
  assert.equal(adapter.state().member?.membershipType, "CO_FOUNDER");
  assert.equal(adapter.state().row?.status, "ACCEPTED");
});
