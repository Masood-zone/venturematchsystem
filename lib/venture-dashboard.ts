import type { Prisma } from "@/lib/generated/prisma/client";

export type SearchParams = Record<string, string | string[] | undefined>;
export type VentureFilters = { q: string; sector: string; hours: string };

export function parseVentureFilters(params: SearchParams): VentureFilters {
  const text = (value: string | string[] | undefined, max: number) =>
    (typeof value === "string" ? value : value?.[0] ?? "").trim().slice(0, max);
  return { q: text(params.q, 120), sector: text(params.sector, 191), hours: text(params.hours, 191) };
}

export function publishedVentureWhere(filters?: VentureFilters): Prisma.ventureWhereInput {
  return {
    status: "ACTIVE",
    ...(filters?.sector ? { primarySectorId: filters.sector } : {}),
    ...(filters?.hours ? { weeklyHoursBand: filters.hours } : {}),
    ...(filters?.q ? { OR: [
      { name: { contains: filters.q } },
      { problem: { contains: filters.q } },
      { venture_capability_requirement: { some: { capability: { name: { contains: filters.q } } } } },
    ] } : {}),
  };
}

export function myVentureWhere(userId: string): Prisma.ventureWhereInput {
  return {
    OR: [
      { ownerId: userId },
      // Membership grants a summary here, never access to another owner's draft.
      { status: { not: "DRAFT" }, venture_member: { some: { userId, status: "ACTIVE" } } },
    ],
  };
}

export const ventureStatusLabels = {
  DRAFT: "Private draft", ACTIVE: "Published", PAUSED: "Paused",
  COMPLETED: "Completed", ARCHIVED: "Archived",
} as const;

export const ventureStageLabels = {
  IDEA: "Idea", VALIDATION: "Validation", PROTOTYPE: "Prototype",
  EARLY_LAUNCH: "Early launch", OPERATE: "Operating",
} as const;
