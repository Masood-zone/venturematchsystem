import "server-only";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { ProfileInput } from "@/lib/student-profile";
import type { activeSkills, activeSectors, lockProfile } from "@/services/onboarding/service";
import { StudentServiceError as OnboardingError } from "@/lib/service-error";

export function createProfileService(database: PrismaClient, dependencies: { lockProfile: typeof lockProfile; activeSkills: typeof activeSkills; activeSectors: typeof activeSectors }) {
  const { lockProfile, activeSkills, activeSectors } = dependencies;
  return async function saveProfile(userId: string, input: ProfileInput) {
    await database.$transaction(async (tx) => {
      const profile = await lockProfile(tx, userId);
      if (!profile.onboardingCompleted) throw new OnboardingError("Finish onboarding before editing your profile.");
      await activeSkills(tx, input.skills.map((skill) => skill.id));
      await activeSectors(tx, input.sectorIds);
      if (!await tx.availability_option.count({ where: { id: input.weeklyHoursBand, active: true } }))
        throw new OnboardingError("Choose an available weekly time band.");
      const now = new Date();
      for (const skill of input.skills) {
        if (skill.proficiency === "EXPERT" && !profile.student_capability.some((saved) => saved.capabilityId === skill.id && saved.proficiency === "EXPERT"))
          throw new OnboardingError("Choose Learning, Practising or Experienced for a new skill.");
        await tx.student_capability.upsert({
          where: { studentProfileId_capabilityId: { studentProfileId: profile.id, capabilityId: skill.id } },
          create: { id: randomUUID(), studentProfileId: profile.id, capabilityId: skill.id, proficiency: skill.proficiency, updatedAt: now },
          update: { proficiency: skill.proficiency, updatedAt: now },
        });
      }
      await tx.student_capability.deleteMany({ where: { studentProfileId: profile.id, capabilityId: { notIn: input.skills.map((skill) => skill.id) } } });
      for (const sectorId of input.sectorIds) await tx.student_venture_interest.upsert({
        where: { studentProfileId_sectorId: { studentProfileId: profile.id, sectorId } },
        create: { id: randomUUID(), studentProfileId: profile.id, sectorId }, update: {},
      });
      await tx.student_venture_interest.deleteMany({ where: { studentProfileId: profile.id, sectorId: { notIn: input.sectorIds } } });
      await tx.student_availability.upsert({ where: { studentProfileId: profile.id },
        create: { id: randomUUID(), studentProfileId: profile.id, weeklyHoursBand: input.weeklyHoursBand, updatedAt: now },
        update: { weeklyHoursBand: input.weeklyHoursBand, updatedAt: now },
      });
      await tx.student_profile.update({ where: { id: profile.id }, data: {
        contributionIntro: input.contributionIntro, teamGoals: input.teamGoals, discoverability: input.discoverability, updatedAt: now,
      } });
    });
    return { saved: true };
  };
}
