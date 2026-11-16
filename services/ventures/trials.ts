import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  collectiveDecision, nextTrialTransition, outstandingReviewers, planStartState, remainingRoster,
  reminderTime, reviewDeadline, trialState, type TrialAction, type TrialPlan, type TrialState,
} from "@/lib/group-trial";
import { OnboardingError } from "@/services/onboarding/service";
import { lockVenture } from "./locking";
import { notify } from "./notices";

type Tx = Prisma.TransactionClient;
type Venture = Awaited<ReturnType<typeof lockVenture>>;
const terminal = ["FORMED", "CLOSED", "INCOMPLETE"];
const trialPath = (id: string) => `/ventures/trials/${id}`;
const fail = (message: string, status = 409): never => { throw new OnboardingError(message, status); };

function notice(tx: Tx, id: string, event: string, recipients: string[], title: string, body: string, email = true, path = trialPath(id)) {
  return notify(tx, { event: `trial:${id}:${event}`, recipients, title, body, path, email });
}

async function findTrialCandidates(tx: Tx, ventureId: string, ownerId: string, candidateIds?: string[]) {
  const candidateId = { not: ownerId, in: candidateIds };
  const [invitations, members] = await Promise.all([
    tx.venture_invitation.findMany({
      where: {
        ventureId, senderUserId: ownerId, status: { in: ["INTERESTED", "TRIAL_PROPOSED"] },
        recipientUserId: candidateId, user_venture_invitation_recipientUserIdTouser: { role: "student" },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { recipientUserId: true, proposedRole: true, user_venture_invitation_recipientUserIdTouser: { select: { name: true } } },
    }),
    tx.venture_member.findMany({
      where: { ventureId, userId: candidateId, status: "ACTIVE", user: { role: "student" } },
      orderBy: [{ joinedAt: "asc" }, { userId: "asc" }],
      select: { userId: true, roleTitle: true, user: { select: { name: true } } },
    }),
  ]);
  const candidates = new Map(invitations.map((invitation) => [invitation.recipientUserId, {
    id: invitation.recipientUserId,
    name: invitation.user_venture_invitation_recipientUserIdTouser.name,
    role: invitation.proposedRole,
  }]));
  for (const member of members) {
    candidates.set(member.userId, { id: member.userId, name: member.user.name, role: member.roleTitle });
  }
  return candidates;
}

export async function eligibleTrialCandidates(ventureId: string, userId: string) {
  const venture = await db.venture.findFirst({
    where: { id: ventureId, ownerId: userId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!venture) return null;
  return [...(await findTrialCandidates(db, ventureId, userId)).values()];
}

async function buildPlan(tx: Tx, venture: Venture, plan: TrialPlan, now: Date) {
  if (new Set(plan.candidateIds).size !== plan.candidateIds.length ||
      plan.candidateIds.includes(venture.ownerId)) fail("Choose distinct candidates.", 400);
  if (plan.startDay < now.toISOString().slice(0, 10) ||
      Date.parse(plan.reviewAt) <= Math.max(now.getTime(), Date.parse(plan.startDay))) {
    fail("Choose a current or future start day and a later review time (UTC).", 400);
  }
  const [owner, candidates] = await Promise.all([
    tx.user.findUniqueOrThrow({ where: { id: venture.ownerId }, select: { name: true } }),
    findTrialCandidates(tx, venture.id, venture.ownerId, plan.candidateIds),
  ]);
  if (plan.candidateIds.some((id) => !candidates.has(id))) {
    fail("Select active venture members or candidates who accepted an invitation.");
  }
  const roster = [{ id: venture.ownerId, name: owner.name, role: "Owner" },
    ...plan.candidateIds.map((id) => candidates.get(id)!),
  ].map((member) => ({ ...member, response: "PENDING" as const, withdrawn: false }));
  if (plan.tasks.some((task) => task.assigneeId && !roster.some((member) => member.id === task.assigneeId))) {
    fail("Assign tasks to people on the roster.", 400);
  }
  const tasks = plan.tasks.map((task) => ({
    ...task, id: randomUUID(), status: "PENDING" as const, text: "", link: "", submittedBy: null,
  }));
  return { roster, tasks };
}

async function storePlan(tx: Tx, id: string, state: TrialState, venture: Venture) {
  await tx.founder_trial_participant.deleteMany({ where: { trialId: id } });
  await tx.founder_trial_participant.createMany({
    data: state.roster.map((person) => ({ id: randomUUID(), trialId: id, userId: person.id, proposedRole: person.role })),
  });
  await tx.group_trial_version.create({ data: {
    trialId: id, version: state.version, terms: { plan: state.plan, responses: planResponses(state) },
  } });
  await notice(tx, id, `plan:${state.version}`, state.roster.map((member) => member.id),
    state.version === 1 ? "Trial agreement requested" : "Trial plan revised",
    `Review and agree to the plan for ${venture.name}. Proposed start: ${state.plan.startDay} UTC.`);
}

function planResponses(state: TrialState) {
  return state.roster.map(({ id, response }) => ({ userId: id, response }));
}

export function proposeTrial(ventureId: string, userId: string, input: { id: string; previousId?: string; plan: TrialPlan }) {
  return db.$transaction(async (tx) => {
    const venture = await lockVenture(tx, ventureId);
    if (venture.ownerId !== userId) fail("Venture not found.", 404);
    if (venture.status !== "ACTIVE") fail("Publish the venture first.");
    const existing = await tx.founder_trial.findUnique({ where: { id: input.id }, select: { ventureId: true, groupState: { select: { trialId: true } } } });
    if (existing) {
      if (existing.ventureId !== ventureId || !existing.groupState) fail("Trial ID is already in use.");
      return { id: input.id };
    }
    if (input.previousId) {
      const source = await tx.founder_trial.findFirst({ where: { id: input.previousId, ventureId }, select: { groupState: true } });
      if (!source?.groupState || !["CLOSED", "INCOMPLETE"].includes(trialState.parse(source.groupState.state).phase)) fail("Choose a closed trial to revise.");
    }
    const now = new Date();
    const group = await buildPlan(tx, venture, input.plan, now);
    const state: TrialState = {
      ...group, plan: input.plan, version: 1, round: 1, phase: "AGREEMENT", ownerId: userId,
      previousId: input.previousId ?? null, reviewAt: input.plan.reviewAt, reviews: [], extension: null, reminded: false,
    };
    await tx.founder_trial.create({ data: {
      id: input.id, ventureId, objective: state.plan.objective, startAt: new Date(state.plan.startDay), reviewAt: new Date(state.reviewAt),
      groupState: { create: { state } },
    } });
    await storePlan(tx, input.id, state, venture);
    return { id: input.id };
  }, { isolationLevel: "ReadCommitted" });
}

async function closeTrial(tx: Tx, id: string, venture: Venture, state: TrialState, phase: "FORMED" | "CLOSED" | "INCOMPLETE", recipients = remainingRoster(state).map((member) => member.id)) {
  state.phase = phase;
  state.extension = null;
  if (phase === "FORMED") {
    for (const member of remainingRoster(state).filter((person) => person.id !== state.ownerId)) {
      await tx.venture_member.upsert({
        where: { ventureId_userId: { ventureId: venture.id, userId: member.id } },
        create: { id: randomUUID(), ventureId: venture.id, userId: member.id, roleTitle: member.role },
        update: { status: "ACTIVE" },
      });
    }
  }
  const title = phase === "FORMED" ? "Venture team formed" : phase === "INCOMPLETE" ? "Trial closed as incomplete" : "Trial closed";
  await notice(tx, id, phase, recipients, title, `${title} for ${venture.name}.`, true, phase === "FORMED" ? `/ventures/${venture.id}` : trialPath(id));
}

async function settleReviews(tx: Tx, id: string, venture: Venture, state: TrialState) {
  const decision = collectiveDecision(state);
  if (decision === "FORMED" || decision === "CLOSED") await closeTrial(tx, id, venture, state, decision);
  if (decision === "EXTENSION") state.phase = "EXTENSION";
}

async function advance(tx: Tx, id: string, venture: Venture, state: TrialState, now: Date, includeReminder = true) {
  if (terminal.includes(state.phase)) return false;
  if (venture.status !== "ACTIVE") {
    await closeTrial(tx, id, venture, state, "CLOSED");
    return true;
  }
  if (["ACTIVE", "REVIEW", "EXTENSION"].includes(state.phase) && now >= reviewDeadline(state)) {
    await closeTrial(tx, id, venture, state, "INCOMPLETE");
    return true;
  }
  if (state.phase === "ACTIVE" && now >= new Date(state.reviewAt)) {
    state.phase = "REVIEW";
    await notice(tx, id, `review:${state.round}`, remainingRoster(state).map((member) => member.id), "Trial review is open",
      `Submit your private review of ${venture.name} by ${reviewDeadline(state).toISOString()} (UTC).`);
    return true;
  }
  if (includeReminder && state.phase === "REVIEW" && !state.reminded && now >= reminderTime(state)) {
    state.reminded = true;
    await notify(tx, {
      event: `trial:${id}:reminder:${state.round}`, recipients: outstandingReviewers(state).map((member) => member.id),
      title: "Trial review reminder", body: `Your private review of ${venture.name} is due by ${reviewDeadline(state).toISOString()} (UTC).`,
      email: true, path: trialPath(id), reviewReminder: { trialId: id, round: state.round },
    });
    return true;
  }
  return false;
}

async function persist(tx: Tx, id: string, state: TrialState) {
  const status = state.phase === "AGREEMENT" ? "PENDING" : state.phase === "ACTIVE" ? "ACTIVE"
    : ["REVIEW", "EXTENSION"].includes(state.phase) ? "UNDER_REVIEW" : state.phase === "FORMED" ? "COMPLETED" : "CANCELLED";
  await tx.founder_trial.update({ where: { id }, data: {
    status, objective: state.plan.objective, startAt: new Date(state.plan.startDay), reviewAt: new Date(state.reviewAt),
    ...(terminal.includes(state.phase) ? { endAt: new Date() } : {}),
    groupState: { update: { state, nextTransitionAt: nextTrialTransition(state) } },
  } });
}

async function applyAction(tx: Tx, id: string, venture: Venture, state: TrialState, actorId: string, action: TrialAction, now: Date) {
  const person = state.roster.find((member) => member.id === actorId);
  if (!person || person.withdrawn) return fail("Trial not found.", 404);
  const owner = actorId === state.ownerId && actorId === venture.ownerId;
  if (terminal.includes(state.phase)) fail("This trial is closed.");
  if ("version" in action && action.version !== state.version) fail("The plan changed. Review the current version.");
  if ("round" in action && action.round !== state.round) fail("The review round changed. Open the latest round.");
  const rosterIds = remainingRoster(state).map((member) => member.id);
  switch (action.action) {
    case "revise": {
      if (!owner || state.phase !== "AGREEMENT") fail("Only the owner can revise a pending plan.");
      const removed = state.roster.filter((member) => ![state.ownerId, ...action.plan.candidateIds].includes(member.id));
      const group = await buildPlan(tx, venture, action.plan, now);
      Object.assign(state, group, { plan: action.plan, version: state.version + 1, reviewAt: action.plan.reviewAt });
      await storePlan(tx, id, state, venture);
      await notice(tx, id, `removed:${state.version}`, removed.map((member) => member.id), "Trial roster updated", `You are no longer on the proposed trial for ${venture.name}.`, false, "/ventures");
      return;
    }
    case "agree":
    case "decline": {
      if (state.phase !== "AGREEMENT") fail("Agreement is closed.");
      const response = action.action === "agree" ? "ACCEPTED" : "DECLINED";
      if (person.response === response) return;
      if (person.response !== "PENDING" || planStartState(state, now) === "EXPIRED") {
        fail("Ask the owner to send an updated plan.");
      }
      person.response = response;
      await tx.group_trial_version.update({
        where: { trialId_version: { trialId: id, version: state.version } },
        data: { terms: { plan: state.plan, responses: planResponses(state) } },
      });
      if (state.roster.every((member) => member.response === "ACCEPTED")) {
        await notice(tx, id, `ready:${state.version}`, [state.ownerId], "Your group trial is ready to start", `Everyone agreed to the plan for ${venture.name}.`);
      }
      return;
    }
    case "start":
      if (!owner || state.phase !== "AGREEMENT" || state.roster.some((member) => member.response !== "ACCEPTED") ||
          planStartState(state, now) !== "TODAY") fail("Start on the agreed UTC day after everyone accepts.");
      await buildPlan(tx, venture, state.plan, now);
      state.phase = "ACTIVE";
      await notice(tx, id, "started", rosterIds, "Group trial started", `The group trial for ${venture.name} has started. Open the workspace to see the plan and tasks.`);
      return;
    case "assign":
    case "work": {
      if (state.phase !== "ACTIVE") fail("Task updates are available during active work.");
      const task = state.tasks.find((item) => item.id === action.taskId);
      if (!task) return fail("Task not found.", 404);
      if (action.action === "assign") {
        if (!owner || (action.assigneeId && !rosterIds.includes(action.assigneeId))) fail("Only the owner can assign tasks to active participants.");
        if (task.assigneeId === action.assigneeId) return;
        const affected = [task.assigneeId, action.assigneeId].filter((member): member is string => !!member);
        task.assigneeId = action.assigneeId;
        await notice(tx, id, `assigned:${randomUUID()}`, affected, "Trial assignment changed", `An assignment changed in the trial for ${venture.name}.`, false);
      } else {
        if (task.assigneeId !== actorId) fail("Only the assignee can update this task.", 403);
        if (action.status === "DONE" && !action.text && !action.link) fail("Include text or a link to submit completed work.", 400);
        Object.assign(task, { status: action.status, text: action.text, link: action.link, submittedBy: actorId });
      }
      return;
    }
    case "withdraw":
      if (!["ACTIVE", "REVIEW", "EXTENSION"].includes(state.phase)) fail("Respond to the proposal before the trial starts.");
      person.withdrawn = true;
      for (const task of state.tasks) {
        if (task.assigneeId === actorId && task.status !== "DONE") task.assigneeId = null;
      }
      if (owner || remainingRoster(state).length < 2) await closeTrial(tx, id, venture, state, "CLOSED", rosterIds);
      else {
        await notice(tx, id, `withdrawn:${actorId}`, remainingRoster(state).map((member) => member.id), "Trial roster updated", `A participant withdrew from the trial for ${venture.name}.`, false);
        if (state.phase === "REVIEW" || state.phase === "EXTENSION") {
          state.extension = null;
          state.phase = "REVIEW";
          await settleReviews(tx, id, venture, state);
        }
      }
      return;
    case "review":
      if (state.phase !== "REVIEW") fail("This review round is closed.");
      if (!outstandingReviewers(state).some((member) => member.id === actorId)) fail("Your review has already been submitted.");
      state.reviews.push({ userId: actorId, round: state.round, review: action.review });
      await settleReviews(tx, id, venture, state);
      return;
    case "extend":
      if (!owner || state.phase !== "EXTENSION" || Date.parse(action.reviewAt) <= Math.max(now.getTime(), Date.parse(state.reviewAt))) {
        fail("Choose a new review time in the future.");
      }
      if (state.extension?.reviewAt === action.reviewAt) return;
      state.extension = { id: randomUUID(), reviewAt: action.reviewAt, accepted: [] };
      await notice(tx, id, `extension:${state.round}:${state.extension.id}`, rosterIds, "Trial extension agreement requested",
        `Review the proposed extension for ${venture.name} and respond by ${reviewDeadline(state).toISOString()} (UTC).`);
      return;
    case "agree-extension": {
      const extension = state.extension;
      if (state.phase !== "EXTENSION" || extension?.id !== action.proposalId) return fail("Review the current extension proposal.");
      if (Date.parse(extension.reviewAt) <= now.getTime()) fail("The proposed review time passed. Ask the owner for a new time.");
      if (!extension.accepted.includes(actorId)) extension.accepted.push(actorId);
      if (rosterIds.every((member) => extension.accepted.includes(member))) {
        state.reviewAt = extension.reviewAt;
        state.round += 1;
        state.phase = "ACTIVE";
        state.reminded = false;
        state.extension = null;
        await notice(tx, id, `extended:${state.round}`, rosterIds, "Trial extension confirmed",
          `The new review time for ${venture.name} is ${state.reviewAt} (UTC).`);
      }
    }
  }
}

async function withTrial<T>(id: string, operation: (tx: Tx, venture: Venture, state: TrialState) => Promise<T>) {
  return db.$transaction(async (tx) => {
    const trial = await tx.founder_trial.findUnique({ where: { id }, select: { ventureId: true } });
    if (!trial) return fail("Trial not found.", 404);
    const venture = await lockVenture(tx, trial.ventureId);
    const row = await tx.group_trial_state.findUnique({ where: { trialId: id } });
    if (!row) return fail("Trial not found.", 404);
    return operation(tx, venture, trialState.parse(row.state));
  }, { isolationLevel: "ReadCommitted" });
}

export async function actOnTrial(id: string, actorId: string, action: TrialAction) {
  const outcome = await withTrial(id, async (tx, venture, state) => {
    if (!state.roster.some((person) => person.id === actorId && !person.withdrawn)) fail("Trial not found.", 404);
    const now = new Date();
    const changed = await advance(tx, id, venture, state, now, false);
    if (terminal.includes(state.phase)) {
      if (changed) await persist(tx, id, state);
      return { closed: true };
    }
    await applyAction(tx, id, venture, state, actorId, action, now);
    if (state.phase === "REVIEW") await advance(tx, id, venture, state, now);
    await persist(tx, id, state);
    return { id };
  });
  if (outcome.closed) fail("This trial is closed.");
  return outcome;
}

export function advanceTrial(id: string) {
  return withTrial(id, async (tx, venture, state) => {
    if (await advance(tx, id, venture, state, new Date())) await persist(tx, id, state);
  });
}

export function trialDetail(id: string, actorId: string) {
  return withTrial(id, async (tx, venture, state) => {
    const viewer = state.roster.find((member) => member.id === actorId);
    if (!viewer) return null;
    const now = new Date();
    if (await advance(tx, id, venture, state, now)) await persist(tx, id, state);
    const owner = state.ownerId === actorId && venture.ownerId === actorId;
    const { roster, reviews, extension } = state;
    return {
      plan: state.plan, phase: state.phase, round: state.round, version: state.version, reviewAt: state.reviewAt,
      tasks: viewer.withdrawn ? state.tasks.filter((task) => task.submittedBy === actorId) : state.tasks,
      venture, owner, viewer, id, deadline: reviewDeadline(state).toISOString(), startState: planStartState(state, now),
      roster: roster.map(({ response, ...member }) => ({ ...member, ...(owner && state.phase === "AGREEMENT" ? { response } : {}) })),
      ownReview: reviews.find((entry) => entry.userId === actorId && entry.round === state.round)?.review ?? null,
      extension: extension && !viewer.withdrawn ? { id: extension.id, reviewAt: extension.reviewAt, accepted: extension.accepted.includes(actorId) } : null,
    };
  });
}

export async function trialList(userId: string, ventureId?: string) {
  const rows = await db.group_trial_state.findMany({
    where: { trial: { ...(ventureId ? { ventureId } : {}), OR: [{ venture: { ownerId: userId } }, { founder_trial_participant: { some: { userId } } }] } },
    select: { trialId: true, state: true, trial: { select: { venture: { select: { name: true } } } } },
    orderBy: { trial: { createdAt: "desc" } }, take: 100,
  });
  return rows.flatMap((row) => {
    const state = trialState.parse(row.state);
    return state.roster.some((person) => person.id === userId)
      ? [{ id: row.trialId, name: row.trial.venture.name, objective: state.plan.objective, phase: state.phase }]
      : [];
  });
}
