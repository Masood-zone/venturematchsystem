import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { db } from "../lib/db";
import { trialState, type TrialPlan, type TrialState } from "../lib/group-trial";
import { invitationInput } from "../lib/venture-recruitment";
import { publishVenture } from "../services/onboarding/service";
import { saveVenture } from "../services/ventures/editor";
import { actOnInvitation, invitationDetail, invite } from "../services/ventures/recruitment";
import { actOnTrial, advanceTrial, eligibleTrialCandidates, proposeTrial, trialDetail } from "../services/ventures/trials";

const review = { decision: "CONTINUE" as const, scores: { alignment: 4, commitment: 4, communication: 4, contribution: 4, reliability: 4 }, workedWell: "Private interview notes", concerns: "" };

async function setClock(trialId: string, reviewAt: string, phase?: TrialState["phase"]) {
  const row = await db.group_trial_state.findUniqueOrThrow({ where: { trialId } });
  const state = trialState.parse(row.state);
  state.reviewAt = reviewAt;
  if (phase) state.phase = phase;
  await db.group_trial_state.update({ where: { trialId }, data: { state, nextTransitionAt: new Date(reviewAt) } });
}

test("TiDB migration supports venture publication, private recruitment and concurrent trial completion", { timeout: 420_000 }, async () => {
  const schema = new URL(process.env.DATABASE_URL ?? "mysql://localhost").pathname.slice(1);
  assert.match(schema, /^venturematch_qa_[0-9]+$/, "Use a disposable venturematch_qa schema.");
  const marker = randomUUID();
  const users = ["owner", "candidate A", "candidate B", "outsider"].map((name, index) => ({
    id: randomUUID(), name, email: `qa-${marker}-${index}@example.test`, updatedAt: new Date(),
  }));
  const [owner, a, b, outsider] = users;
  const ventureId = randomUUID();
  try {
    const [skill, sector, availability] = await Promise.all([
      db.capability.findFirstOrThrow({ where: { status: "ACTIVE", capability_family: { status: "ACTIVE" } } }),
      db.venture_sector.findFirstOrThrow({ where: { status: "ACTIVE" } }),
      db.availability_option.findFirstOrThrow({ where: { active: true } }),
    ]);
    for (const user of users) {
      await db.user.create({ data: { ...user, student_profile: { create: {
        id: randomUUID(), updatedAt: new Date(), onboardingGoal: "JOIN_TEAM", onboardingCompleted: true, discoverability: true,
        student_availability: { create: { id: randomUUID(), weeklyHoursBand: availability.id, updatedAt: new Date() } },
        student_capability: { create: { id: randomUUID(), capabilityId: skill.id, proficiency: "BEGINNER", updatedAt: new Date() } },
        student_venture_interest: { create: { id: randomUUID(), sectorId: sector.id } },
      } } } });
    }
    const draft = {
      title: "Trial QA venture", problem: "Validate demand for a student service.", targetUsers: "USTED students",
      contribution: "Run interviews.", capabilityIds: [skill.id], sectorId: sector.id, step: 2,
    };
    await saveVenture(owner.id, ventureId, draft, true);
    await assert.rejects(saveVenture(outsider.id, ventureId, draft), /not found/i);
    assert.equal((await db.venture.findUniqueOrThrow({ where: { id: ventureId } })).editorStep, 2);
    assert.equal((await publishVenture(owner.id, ventureId)).status, "ACTIVE");

    await db.venture_member.create({
      data: { id: randomUUID(), ventureId, userId: a.id, status: "ACTIVE", roleTitle: "Interviewer" },
    });
    assert.deepEqual(await eligibleTrialCandidates(ventureId, owner.id), [
      { id: a.id, name: a.name, role: "Interviewer" },
    ]);
    assert.equal(await eligibleTrialCandidates(ventureId, outsider.id), null);

    const candidate = b;
    const profile = await db.student_profile.findUniqueOrThrow({ where: { userId: candidate.id } });
    const message = "Would you like to discuss interviews? ".repeat(60).slice(0, 1999) + "?";
    const input = invitationInput.parse({ candidateId: profile.id, role: "Researcher", message, commitment: "SERIOUS" });
    const results = await Promise.all([invite(ventureId, owner.id, input), invite(ventureId, owner.id, input)]);
    assert.equal(results[0].id, results[1].id);
    const [{ id: invitationId }] = results;
    assert.equal((await invitationDetail(invitationId, candidate.id))?.message, message);
    assert.equal(await invitationDetail(invitationId, outsider.id), null);
    await actOnInvitation(invitationId, candidate.id, { action: "interest" });
    assert.equal(await db.venture_member.count({ where: { ventureId } }), 1);
    await actOnInvitation(invitationId, owner.id, { action: "message", id: randomUUID(), text: "Let's discuss the interview plan." });
    assert.equal((await invitationDetail(invitationId, candidate.id))?.messages.length, 1);

    const plan: TrialPlan = {
      objective: "Validate demand", expectations: "One interview each", candidateIds: [a.id, b.id],
      startDay: new Date().toISOString().slice(0, 10), reviewAt: new Date(Date.now() + 3_600_000).toISOString(),
      tasks: [{ title: "Interview", description: "Record evidence", assigneeId: a.id }],
    };
    await assert.rejects(proposeTrial(ventureId, owner.id, {
      id: randomUUID(), plan: { ...plan, candidateIds: [a.id, outsider.id] },
    }), /select active venture members/i);
    const sourceId = randomUUID();
    await proposeTrial(ventureId, owner.id, { id: sourceId, plan });
    assert.equal((await trialDetail(sourceId, a.id))?.viewer.response, "PENDING");
    await setClock(sourceId, new Date(Date.now() - 1_000).toISOString(), "ACTIVE");
    await advanceTrial(sourceId);
    await Promise.all([
      actOnTrial(sourceId, owner.id, { action: "review", round: 1, review }),
      actOnTrial(sourceId, a.id, { action: "review", round: 1, review: { ...review, decision: "EXTEND" } }),
      actOnTrial(sourceId, b.id, { action: "review", round: 1, review }),
    ]);
    assert.equal((await trialDetail(sourceId, b.id))?.phase, "EXTENSION");
    const extensionTime = new Date(Date.now() + 3_600_000).toISOString();
    await actOnTrial(sourceId, owner.id, { action: "extend", round: 1, reviewAt: extensionTime });
    const proposalId = (await trialDetail(sourceId, a.id))?.extension?.id;
    assert.ok(proposalId);
    await assert.rejects(actOnTrial(sourceId, b.id, { action: "agree-extension", round: 1, proposalId: randomUUID() }), /current extension/i);
    await Promise.all([owner, a, b].map((person) => actOnTrial(sourceId, person.id, { action: "agree-extension", round: 1, proposalId })));
    assert.equal((await trialDetail(sourceId, a.id))?.phase, "ACTIVE");
    assert.equal((await trialDetail(sourceId, a.id))?.round, 2);
    await actOnTrial(sourceId, a.id, { action: "withdraw" });
    assert.equal((await trialDetail(sourceId, b.id))?.tasks[0].assigneeId, null);
    await actOnTrial(sourceId, owner.id, { action: "withdraw" });
    assert.equal((await trialDetail(sourceId, b.id))?.phase, "CLOSED");

    const expiredId = randomUUID();
    await proposeTrial(ventureId, owner.id, { id: expiredId, previousId: sourceId, plan });
    await setClock(expiredId, new Date(Date.now() - 73 * 3_600_000).toISOString(), "ACTIVE");
    await advanceTrial(expiredId);
    assert.equal((await trialDetail(expiredId, a.id))?.phase, "INCOMPLETE");

    const id = randomUUID();
    await proposeTrial(ventureId, owner.id, { id, previousId: sourceId, plan });
    assert.equal(await trialDetail(id, outsider.id), null);
    await actOnTrial(id, a.id, { action: "agree", version: 1 });
    await actOnTrial(id, owner.id, { action: "revise", version: 1, plan: { ...plan, objective: "Validate two interviews" } });
    await assert.rejects(actOnTrial(id, a.id, { action: "agree", version: 1 }), /plan changed/i);
    assert.equal((await trialDetail(id, a.id))?.viewer.response, "PENDING");
    await assert.rejects(actOnTrial(id, owner.id, { action: "start", version: 2 }), /everyone accepts/i);
    await Promise.all([owner, a, b].map((user) => actOnTrial(id, user.id, { action: "agree", version: 2 })));
    await actOnTrial(id, owner.id, { action: "start", version: 2 });
    const view = await trialDetail(id, a.id);
    const taskId = view!.tasks[0].id;
    await assert.rejects(actOnTrial(id, b.id, { action: "work", taskId, status: "DONE", text: "Other student's work", link: "" }), /assignee/i);
    await actOnTrial(id, a.id, { action: "work", taskId, status: "DONE", text: "Interview complete", link: "" });

    // Simulate the passing clock in a disposable database without waiting 36 hours.
    await setClock(id, new Date(Date.now() - 37 * 3_600_000).toISOString());
    await advanceTrial(id);
    await actOnTrial(id, a.id, { action: "review", round: 1, review });
    await advanceTrial(id);
    assert.equal((await trialDetail(id, owner.id))?.ownReview, null);
    assert.doesNotMatch(JSON.stringify(await trialDetail(id, owner.id)), /Private interview notes/);
    const reminders = await db.venture_email_outbox.findMany({ where: { reviewTrialId: id }, select: { userId: true } });
    assert.deepEqual(reminders.map(({ userId }) => userId).sort(), [owner.id, b.id].sort());
    await Promise.all([owner, b].map((user) => actOnTrial(id, user.id, { action: "review", round: 1, review })));
    assert.equal((await trialDetail(id, b.id))?.phase, "FORMED");
    assert.equal(await db.venture_member.count({ where: { ventureId, status: "ACTIVE" } }), 2);
    assert.equal(await db.venture_email_outbox.count({ where: { path: `/ventures/${ventureId}`, title: "Venture team formed" } }), 3);
  } finally {
    const userIds = users.map(({ id }) => id);
    try {
      await db.venture_email_outbox.deleteMany({ where: { userId: { in: userIds } } });
      await db.conversation.deleteMany({ where: { ventureId } });
      await db.venture.deleteMany({ where: { id: ventureId } });
      await db.user.deleteMany({ where: { id: { in: userIds } } });
    } finally {
      await db.$disconnect();
    }
  }
});
