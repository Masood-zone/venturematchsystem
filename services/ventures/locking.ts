import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { OnboardingError } from "@/services/onboarding/service";

export async function lockVenture(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM venture WHERE id = ${id} FOR UPDATE`;
  const venture = await tx.venture.findUnique({ where: { id }, select: { id: true, name: true, ownerId: true, status: true } });
  if (!venture) throw new OnboardingError("Venture not found.", 404);
  return venture;
}
