import assert from "node:assert/strict";
import test from "node:test";
import {
  collectiveDecision, nextTrialTransition, outstandingReviewers, planStartState, reminderTime, reviewDeadline, trialAction, type TrialState,
} from "../lib/group-trial";
import { completedEntry, entryContext, entryHref } from "../lib/student-entry";
import type { Prisma } from "../lib/generated/prisma/client";
import { notify } from "../services/ventures/notices";
import { renderEmail } from "../services/email/email-service";

const reviewAt = "2026-11-15T16:00:00.000Z";
function trial(): TrialState {
  return {
    ownerId: "owner", previousId: null, version: 1, round: 1, phase: "REVIEW", reviewAt, reviews: [], extension: null, reminded: false,
    plan: { objective: "Test demand", expectations: "Share one interview", candidateIds: ["a", "b"], startDay: "2026-11-12", reviewAt, tasks: [] },
    tasks: [], roster: ["owner", "a", "b"].map((id) => ({ id, name: id, role: null, withdrawn: false, response: "ACCEPTED" })),
  };
}
function addReview(state: TrialState, userId: string, decision: TrialState["reviews"][number]["review"]["decision"]) {
  state.reviews.push({
    userId, round: state.round,
    review: { decision, workedWell: "", concerns: "", scores: { alignment: 4, commitment: 4, communication: 4, contribution: 4, reliability: 4 } },
  });
}

test("only remaining participants with no decision receive a review reminder", () => {
  const state = trial();
  addReview(state, "owner", "CONTINUE");
  state.roster[2].withdrawn = true;
  assert.deepEqual(outstandingReviewers(state).map(({ id }) => id), ["a"]);
  assert.equal(collectiveDecision(state), "WAITING");
  addReview(state, "a", "CONTINUE");
  assert.equal(collectiveDecision(state), "FORMED");
  state.round += 1;
  assert.equal(collectiveDecision(state), "WAITING");
});

test("all remaining reviews are required and a stop decision prevents an extension", () => {
  const state = trial();
  addReview(state, "owner", "CONTINUE");
  addReview(state, "a", "EXTEND");
  assert.equal(collectiveDecision(state), "WAITING");
  addReview(state, "b", "STOP");
  assert.equal(collectiveDecision(state), "CLOSED");
  state.roster[2].withdrawn = true;
  assert.equal(collectiveDecision(state), "EXTENSION");
});

test("trial dates use UTC and review deadlines are exactly 36 and 72 hours apart", () => {
  const state = trial();
  assert.equal(planStartState(state, new Date("2026-11-11T23:59:59.999Z")), "UPCOMING");
  assert.equal(planStartState(state, new Date("2026-11-12T00:00:00.000Z")), "TODAY");
  assert.equal(planStartState(state, new Date("2026-11-13T00:00:00.000Z")), "EXPIRED");
  assert.equal(reminderTime(state).toISOString(), "2026-11-17T04:00:00.000Z");
  assert.equal(nextTrialTransition(state)?.toISOString(), "2026-11-17T04:00:00.000Z");
  state.reminded = true;
  assert.equal(nextTrialTransition(state)?.toISOString(), "2026-11-18T16:00:00.000Z");
  assert.equal(reviewDeadline(state).toISOString(), "2026-11-18T16:00:00.000Z");
});

test("trial action boundaries require agreement version and extension proposal ID and reject unsafe work links", () => {
  assert.equal(trialAction.safeParse({ action: "agree" }).success, false);
  assert.equal(trialAction.safeParse({ action: "agree-extension", round: 1, reviewAt }).success, false);
  assert.equal(trialAction.safeParse({ action: "work", taskId: "task", status: "DONE", text: "", link: "javascript:alert(1)" }).success, false);
});

test("email links survive sign-in and cannot redirect outside VentureMatch", () => {
  const path = entryHref("/login", { invitationId: "test-invitation" });
  const context = entryContext(new URL(path, "https://example.test").searchParams);
  assert.equal(completedEntry(context, "/ventures"), "/ventures/invitations/test-invitation");
  assert.equal(completedEntry(entryContext(new URLSearchParams({ trial: "//example.test" })), "/ventures"), "/ventures");
  assert.equal(completedEntry(entryContext(new URLSearchParams({ trial: "test-trial" })), "/ventures"), "/ventures/trials/test-trial");
});

test("transactional notices deduplicate per event and person and leave routine work out of the email queue", async () => {
  const notifications = new Map<string, object>();
  const outbox = new Map<string, { userId: string; reviewRound?: number }>();
  const transaction = {
    notification: { createMany: async ({ data }: { data: { id: string }[] }) => {
      for (const row of data) notifications.set(row.id, row);
    } },
    venture_email_outbox: { createMany: async ({ data }: { data: { id: string; userId: string; reviewRound?: number }[] }) => {
      for (const row of data) outbox.set(row.id, row);
    } },
  } as unknown as Prisma.TransactionClient;
  const notice = {
    event: "trial:demo:reminder:1", recipients: ["owner", "a", "a"], title: "Trial review reminder", body: "Review is due tomorrow.",
    path: "/ventures/trials/demo", email: true, reviewReminder: { trialId: "demo", round: 1 },
  };
  await notify(transaction, notice);
  await notify(transaction, notice);
  await notify(transaction, { ...notice, event: "task", recipients: ["a"], email: false });
  assert.equal(notifications.size, 3);
  assert.deepEqual([...outbox.values()].map((row) => [row.userId, row.reviewRound]), [["owner", 1], ["a", 1]]);
});

test("venture activity emails render a private deep link and deadline", async () => {
  const before = process.env.BETTER_AUTH_URL;
  process.env.BETTER_AUTH_URL = "https://example.test";
  try {
    const message = await renderEmail({
      kind: "venture-activity", userEmail: "student@example.test", userName: "Student", title: "Trial review reminder",
      body: "Your private review is due by 2026-11-18 16:00 UTC.", path: "/ventures/trials/demo",
    });
    assert.equal(message.subject, "Trial review reminder");
    assert.match(message.html, /https:\/\/example\.test\/ventures\/trials\/demo/);
    assert.match(message.text, /2026-11-18 16:00 UTC/);
  } finally {
    if (before === undefined) delete process.env.BETTER_AUTH_URL;
    else process.env.BETTER_AUTH_URL = before;
  }
});
