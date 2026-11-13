import "server-only";
import { db } from "@/lib/db";
import { discoverableStudentWhere, publicProfileSelect } from "@/lib/onboarding";
import { publishedVentureWhere, type VentureFilters } from "@/lib/venture-dashboard";

export const ventureBriefSelect = {
  id: true, name: true, shortPitch: true, problem: true, targetUsers: true, status: true,
  primarySectorId: true, recruitmentContribution: true, weeklyHoursBand: true, stage: true,
  user: { select: { name: true } },
  venture_capability_requirement: { select: { capability: { select: { id: true, name: true } } } },
} as const;
export function publishedVentures(filters?: VentureFilters) {
  return db.venture.findMany({ where: publishedVentureWhere(filters), select: ventureBriefSelect, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: 100 });
}
export function discoverableStudents() {
  return db.student_profile.findMany({ where: discoverableStudentWhere, select: publicProfileSelect, orderBy: { updatedAt: "desc" }, take: 100 });
}
export function accessibleVenture(id: string, userId: string) {
  return db.venture.findFirst({ where: { id, OR: [{ ownerId: userId }, { status: "ACTIVE" }] }, select: { ...ventureBriefSelect, ownerId: true } });
}
