import type { Goal } from "./onboarding";

export type EntryContext = { goal?: Goal; ventureId?: string; invitationId?: string; trialId?: string };
type Params = { get(name: string): string | null };

// Only supported intents and opaque IDs cross authentication boundaries.
export function entryContext(params: Params): EntryContext {
  const goal = params.get("goal");
  const venture = params.get("venture");
  const invitation = params.get("invitation");
  const trial = params.get("trial");
  const opaqueId = /^[a-zA-Z0-9_-]{1,191}$/;
  return {
    ...(goal === "JOIN_TEAM" || goal === "BUILD_IDEA" ? { goal } : {}),
    ...(venture && opaqueId.test(venture) ? { ventureId: venture } : {}),
    ...(invitation && opaqueId.test(invitation) ? { invitationId: invitation } : {}),
    ...(trial && opaqueId.test(trial) ? { trialId: trial } : {}),
  };
}

export function entryHref(path: string, context: EntryContext) {
  const query = new URLSearchParams();
  if (context.goal) query.set("goal", context.goal);
  if (context.ventureId) query.set("venture", context.ventureId);
  if (context.invitationId) query.set("invitation", context.invitationId);
  if (context.trialId) query.set("trial", context.trialId);
  return `${path}${query.size ? `?${query}` : ""}`;
}

export function completedEntry(context: EntryContext, fallback: string) {
  if (context.invitationId) return `/ventures/invitations/${encodeURIComponent(context.invitationId)}`;
  if (context.trialId) return `/ventures/trials/${encodeURIComponent(context.trialId)}`;
  if (context.ventureId) return `/ventures/${encodeURIComponent(context.ventureId)}`;
  if (context.goal === "JOIN_TEAM") return "/explore";
  if (context.goal === "BUILD_IDEA") return "/ventures";
  return fallback;
}
