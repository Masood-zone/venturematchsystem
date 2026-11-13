import { z } from "zod";

const id = z.string().min(1).max(100);
const line = (max: number) => z.string().trim().min(1).max(max);
const instant = z.iso.datetime();
const taskPlan = z.object({
  title: line(100), description: z.string().trim().max(1000), assigneeId: id.nullable(),
});
export const trialPlan = z.object({
  objective: line(1000), expectations: line(1000),
  candidateIds: z.array(id).min(1).max(12),
  startDay: z.iso.date(), reviewAt: instant,
  tasks: z.array(taskPlan).min(1).max(12),
});
export const trialProposal = z.object({ id: z.uuid(), previousId: id.optional(), plan: trialPlan });
export const reviewInput = z.object({
  decision: z.enum(["CONTINUE", "EXTEND", "STOP"]),
  scores: z.object({
    communication: z.number().int().min(1).max(5),
    reliability: z.number().int().min(1).max(5),
    contribution: z.number().int().min(1).max(5),
    commitment: z.number().int().min(1).max(5),
    alignment: z.number().int().min(1).max(5),
  }),
  workedWell: z.string().trim().max(2000),
  concerns: z.string().trim().max(2000),
});
const version = z.number().int().positive();
const taskAction = z.object({
  taskId: id, status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]),
  text: z.string().trim().max(4000),
  link: z.union([z.literal(""), z.url({ protocol: /^https?$/ }).max(1000)]),
});
export const trialAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("revise"), version, plan: trialPlan }),
  z.object({ action: z.literal("agree"), version }),
  z.object({ action: z.literal("decline"), version }),
  z.object({ action: z.literal("start"), version }),
  z.object({ action: z.literal("assign"), taskId: id, assigneeId: id.nullable() }),
  taskAction.extend({ action: z.literal("work") }),
  z.object({ action: z.literal("withdraw") }),
  z.object({ action: z.literal("review"), round: version, review: reviewInput }),
  z.object({ action: z.literal("extend"), round: version, reviewAt: instant }),
  z.object({ action: z.literal("agree-extension"), round: version, proposalId: z.uuid() }),
]);
export const trialState = z.object({
  plan: trialPlan, version, round: version,
  phase: z.enum(["AGREEMENT", "ACTIVE", "REVIEW", "EXTENSION", "FORMED", "CLOSED", "INCOMPLETE"]),
  ownerId: id, previousId: id.nullable(),
  roster: z.array(z.object({ id, name: z.string(), role: z.string().nullable(), response: z.enum(["PENDING", "ACCEPTED", "DECLINED"]), withdrawn: z.boolean() })),
  tasks: z.array(taskPlan.extend({ id, status: taskAction.shape.status, text: taskAction.shape.text, link: taskAction.shape.link, submittedBy: id.nullable() })),
  reviewAt: instant,
  reviews: z.array(z.object({ userId: id, round: version, review: reviewInput })),
  extension: z.object({ id: z.uuid(), reviewAt: instant, accepted: z.array(id) }).nullable(),
  reminded: z.boolean(),
});
export type TrialPlan = z.infer<typeof trialPlan>;
export type TrialState = z.infer<typeof trialState>;
export type TrialAction = z.infer<typeof trialAction>;

const hour = 60 * 60 * 1000;
export function reviewDeadline(state: TrialState) {
  return new Date(Date.parse(state.reviewAt) + 72 * hour);
}
export function planStartState(state: TrialState, now: Date) {
  const day = now.toISOString().slice(0, 10);
  if (day > state.plan.startDay || now >= new Date(state.plan.reviewAt)) return "EXPIRED";
  return day === state.plan.startDay ? "TODAY" : "UPCOMING";
}
export function reminderTime(state: TrialState) {
  return new Date(Date.parse(state.reviewAt) + 36 * hour);
}
export function remainingRoster(state: TrialState) {
  return state.roster.filter((participant) => !participant.withdrawn);
}
export function outstandingReviewers(state: TrialState) {
  const submitted = new Set(state.reviews.filter((review) => review.round === state.round).map((review) => review.userId));
  return remainingRoster(state).filter((participant) => !submitted.has(participant.id));
}
export function collectiveDecision(state: TrialState) {
  if (outstandingReviewers(state).length) return "WAITING";
  const participants = new Set(remainingRoster(state).map((participant) => participant.id));
  const reviews = state.reviews.filter((review) => review.round === state.round && participants.has(review.userId));
  if (reviews.some(({ review }) => review.decision === "STOP")) return "CLOSED";
  return reviews.some(({ review }) => review.decision === "EXTEND") ? "EXTENSION" : "FORMED";
}
export function nextTrialTransition(state: TrialState) {
  if (state.phase === "ACTIVE") return new Date(state.reviewAt);
  if (state.phase === "REVIEW") return state.reminded ? reviewDeadline(state) : reminderTime(state);
  if (state.phase === "EXTENSION") return reviewDeadline(state);
  return null;
}
