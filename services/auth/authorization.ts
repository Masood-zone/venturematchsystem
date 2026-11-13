import "server-only";
import { auth } from "./auth";

export const roles = ["student", "admin", "moderator", "verifier"] as const;
export type AppRole = (typeof roles)[number];

export class AccessError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Authentication required." : "Access denied.");
  }
}

export function isAppRole(value: unknown): value is AppRole {
  return roles.some((role) => role === value);
}

// Call inside every protected handler/action, before reading or changing data.
// Staff roles are separate: no implicit admin/moderator/verifier inheritance.
export async function authorize(
  headers: Headers,
  allowedRoles?: readonly AppRole[],
) {
  const session = await auth.api.getSession({ headers });
  if (!session) throw new AccessError(401);
  if (!isAppRole(session.user.role)) throw new AccessError(403);
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new AccessError(403);
  }
  return session;
}
