import "server-only";
import { db } from "@/lib/db";
import { myVentureWhere } from "@/lib/venture-dashboard";

export function myVentures(userId: string) {
  return db.venture.findMany({
    where: myVentureWhere(userId),
    select: {
      id: true, ownerId: true, name: true, problem: true, shortPitch: true,
      status: true, stage: true,
      venture_sector_venture_primarySectorIdToventure_sector: { select: { name: true } },
      venture_member: { where: { userId, status: "ACTIVE" }, select: { roleTitle: true } },
      _count: { select: { venture_member: { where: { status: "ACTIVE" } }, applications: { where: { status: "PENDING" } } } },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
  });
}

export type MyVenture = Awaited<ReturnType<typeof myVentures>>[number];
