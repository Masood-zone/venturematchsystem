import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import type { VentureEditorInput } from "@/lib/venture-editor";
import { activeSectors, activeSkills, OnboardingError, validateIdea } from "@/services/onboarding/service";

export function saveVenture(userId: string, id: string, input: VentureEditorInput, create = false) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM student_profile WHERE userId = ${userId} FOR UPDATE`;
    const profile = await tx.student_profile.findUnique({ where: { userId }, select: { onboardingCompleted: true, student_availability: { select: { weeklyHoursBand: true } } } });
    if (!profile?.onboardingCompleted) throw new OnboardingError("Complete student setup first.", 403);
    await tx.$queryRaw`SELECT id FROM venture WHERE id = ${id} FOR UPDATE`;
    const venture = await tx.venture.findUnique({ where: { id } });
    if (venture && (venture.ownerId !== userId || !["DRAFT", "ACTIVE"].includes(venture.status))) {
      throw new OnboardingError("Editable venture not found.", 404);
    }
    if (!venture && !create) throw new OnboardingError("Editable venture not found.", 404);
    if (venture && create) return { id: venture.id };
    if (input.sectorId) await activeSectors(tx, [input.sectorId]);
    if (input.weeklyHoursBand && !(await tx.availability_option.count({ where: { id: input.weeklyHoursBand, active: true } }))) {
      throw new OnboardingError("Choose an available weekly commitment.", 400);
    }
    const capabilities = [...new Set(input.capabilityIds)];
    if (capabilities.length) await activeSkills(tx, capabilities);
    const data = {
      name: input.title,
      problem: input.problem,
      targetUsers: input.targetUsers,
      primarySectorId: input.sectorId || null,
      recruitmentContribution: input.contribution,
      ...(input.stage ? { stage: input.stage } : {}),
      ...(input.weeklyHoursBand !== undefined ? { weeklyHoursBand: input.weeklyHoursBand || profile.student_availability?.weeklyHoursBand || null } : {}),
      editorStep: input.step,
      updatedAt: new Date(),
    };
    if (venture?.status === "ACTIVE") {
      await validateIdea(tx, {
        ...data,
        venture_capability_requirement: capabilities.map((capabilityId) => ({ capabilityId, confirmed: true })),
      }, true);
    }
    if (venture) await tx.venture.update({ where: { id }, data });
    else await tx.venture.create({ data: { ...data, id, ownerId: userId, slug: id } });
    await tx.venture_capability_requirement.deleteMany({ where: { ventureId: id, capabilityId: { notIn: capabilities } } });
    for (const capabilityId of capabilities) {
      await tx.venture_capability_requirement.upsert({
        where: { ventureId_capabilityId: { ventureId: id, capabilityId } },
        create: { id: randomUUID(), ventureId: id, capabilityId, confirmed: true },
        update: { confirmed: true },
      });
    }
    return { id };
  }, { isolationLevel: "ReadCommitted" });
}
